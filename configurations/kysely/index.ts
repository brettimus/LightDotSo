// Copyright (C) 2023 Light, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { Pool } from "@neondatabase/serverless";
import { Kysely, PostgresDialect } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";

import type { DB } from "./src/db/types";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = new Kysely<DB>({
  dialect:
    process.env.NODE_ENV === "development"
      ? new PostgresJSDialect({
          connectionString: process.env.DATABASE_URL,
          options: {
            max: 10,
          },
          postgres,
        })
      : new PostgresDialect({ pool }),
});
