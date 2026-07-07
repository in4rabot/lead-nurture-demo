import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  interest: string | null;
  created_at: string;
  followed_up: number;
  email_status: string;
}

export interface NewLeadInput {
  name: string;
  email: string;
  phone?: string | null;
  interest?: string | null;
}

let dbInstance: Database.Database | null = null;

/**
 * Returns a singleton better-sqlite3 Database instance backed by data/leads.db.
 * Creates the `leads` table (and the data/ directory) on first call, and
 * seeds 5 realistic demo rows the very first time the table is empty so the
 * dashboard looks populated immediately in a fresh checkout/demo.
 */
export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "leads.db");
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      interest TEXT,
      created_at TEXT NOT NULL,
      followed_up INTEGER NOT NULL DEFAULT 0,
      email_status TEXT NOT NULL DEFAULT 'pending'
    );
  `);

  seedDemoDataIfEmpty(db);

  dbInstance = db;
  return dbInstance;
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setTime(d.getTime() - days * 24 * 60 * 60 * 1000);
  return d.toISOString();
}

function seedDemoDataIfEmpty(db: Database.Database): void {
  const row = db.prepare("SELECT COUNT(*) as count FROM leads").get() as {
    count: number;
  };
  if (row.count > 0) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO leads (name, email, phone, interest, created_at, followed_up, email_status)
    VALUES (@name, @email, @phone, @interest, @created_at, @followed_up, @email_status)
  `);

  const demoLeads = [
    {
      name: "Priya Nair",
      email: "priya.nair@brightloop.io",
      phone: "(415) 555-0148",
      interest: "Web Development",
      created_at: daysAgoIso(0),
      followed_up: 0,
      email_status: "simulated",
    },
    {
      name: "Marcus Webb",
      email: "marcus.webb@fieldcraftco.com",
      phone: "(312) 555-0119",
      interest: "Mobile App",
      created_at: daysAgoIso(1),
      followed_up: 0,
      email_status: "sent",
    },
    {
      name: "Elena Torres",
      email: "elena.torres@grovemail.com",
      phone: "(206) 555-0173",
      interest: "Automation / Workflow",
      created_at: daysAgoIso(2),
      followed_up: 1,
      email_status: "sent",
    },
    {
      name: "David Okonkwo",
      email: "d.okonkwo@summitpartners.net",
      phone: "(646) 555-0161",
      interest: "Consulting",
      created_at: daysAgoIso(4),
      followed_up: 0,
      email_status: "sent",
    },
    {
      name: "Hannah Lindqvist",
      email: "hannah.lindqvist@northwindstudio.se",
      phone: "(917) 555-0107",
      interest: "Other",
      created_at: daysAgoIso(8),
      followed_up: 0,
      email_status: "simulated",
    },
  ];

  const insertMany = db.transaction((leads: typeof demoLeads) => {
    for (const lead of leads) {
      insert.run(lead);
    }
  });

  insertMany(demoLeads);
}

/**
 * Inserts a new lead with created_at set to the current time and returns the
 * full inserted row (including its generated id).
 */
export function createLead(input: NewLeadInput): Lead {
  const db = getDb();
  const created_at = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO leads (name, email, phone, interest, created_at, followed_up, email_status)
    VALUES (@name, @email, @phone, @interest, @created_at, 0, 'pending')
  `);

  const result = insert.run({
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    interest: input.interest ?? null,
    created_at,
  });

  return db
    .prepare("SELECT * FROM leads WHERE id = ?")
    .get(result.lastInsertRowid) as Lead;
}

/**
 * Returns all leads ordered by created_at, ascending or descending.
 */
export function getAllLeads(sort: "asc" | "desc" = "desc"): Lead[] {
  const db = getDb();
  const direction = sort === "asc" ? "ASC" : "DESC";
  return db
    .prepare(`SELECT * FROM leads ORDER BY created_at ${direction}`)
    .all() as Lead[];
}

/**
 * Marks a lead as followed up.
 */
export function markFollowedUp(id: number): void {
  const db = getDb();
  db.prepare("UPDATE leads SET followed_up = 1 WHERE id = ?").run(id);
}

/**
 * Updates the email_status for a lead (e.g. 'pending' | 'sent' | 'simulated' | 'failed').
 */
export function updateEmailStatus(id: number, status: string): void {
  const db = getDb();
  db.prepare("UPDATE leads SET email_status = ? WHERE id = ?").run(
    status,
    id
  );
}
