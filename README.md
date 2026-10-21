# Student Management MCP Server

This is a real **Model Context Protocol (MCP) server**, not a regular REST API. It lets a compatible MCP host discover and call tools that manage student records in MongoDB Atlas.

## Tools exposed

- `add_student` — insert a student record; Student ID must be unique.
- `list_students` — list up to 100 records.
- `search_students` — search by ID, name, email, or department.
- `update_student` — update a record using its MongoDB document ID.
- `delete_student` — delete a record by MongoDB document ID.

## A. Requirements

- Node.js 18 or newer (use a current LTS release)
- MongoDB Atlas account and active cluster
- An MCP-compatible client such as Claude Desktop or a supported MCP-enabled editor

Official SDK docs: https://ts.sdk.modelcontextprotocol.io/
MCP overview: https://modelcontextprotocol.io/

## B. Set up MongoDB Atlas

1. Use your active Atlas cluster.
2. Under **Security → Database Access**, create a database user with a strong password and read/write permission.
3. Under **Security → Network Access**, allow the machine that runs this MCP server to connect. For a temporary classroom test only, `0.0.0.0/0` allows all IPs and is less secure; narrow this rule when possible.
4. Click **Connect → Drivers → Node.js** and copy the URI.
5. Add `/studentDB` to the URI path, for example:
   `mongodb+srv://USERNAME:PASSWORD@cluster.example.mongodb.net/studentDB?retryWrites=true&w=majority`
6. URL-encode special characters in the password if needed.

## C. Install and configure on Windows

1. Extract the ZIP to a folder, e.g. `C:\Users\YOUR_USER\Desktop\student-management-mcp-server`.
2. Open that folder in VS Code (**File → Open Folder**).
3. Open **Terminal → New Terminal**.
4. Run:

```powershell
npm install
Copy-Item .env.example .env
```

5. Open `.env` and replace the example `MONGODB_URI` with your actual Atlas URI. Save it.
6. Start the server:

```powershell
npm start
```

The server connects to MongoDB and waits for MCP messages on standard input/output. It is not intended to be tested by opening a URL in a browser. Press `Ctrl+C` to stop it. Startup logs go to stderr to preserve the MCP stdio protocol.

## D. Connect to an MCP host

MCP client setup differs by app and version. For a local stdio server, the host starts this command as a child process. Use the **absolute path** to this project's `src/index.js`.

Example Claude Desktop configuration (Windows; edit paths to match your computer):

```json
{
  "mcpServers": {
    "student-management": {
      "command": "node",
      "args": [
        "C:\\Users\\YOUR_USER\\Desktop\\student-management-mcp-server\\src\\index.js"
      ],
      "env": {
        "MONGODB_URI": "mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/studentDB?retryWrites=true&w=majority"
      }
    }
  }
}
```

Find the correct config location and reload/restart the MCP host using that app's current instructions. If you use this JSON environment-variable method, protect the config file because it contains a database credential. A safer local setup is to use a launcher script that loads `.env` without placing the URI in the client config; tell me your MCP host and I can give you the exact configuration.

**Important:** Do not paste a fake URI into your config. Replace all placeholders. JSON backslashes in Windows paths must be doubled.

## E. Test the tools

After the host connects, ask it to:

1. Call `list_students` with limit 10.
2. Call `add_student` with a test record:
   - studentId: `ST1001`
   - name: `Test Student`
   - email: `test.student@example.com`
   - department: `Computer Engineering`
   - semester: `4`
   - contact: `0000000000`
3. Call `search_students` with query `ST1001`.
4. Use the returned MongoDB `id` to call `update_student`, changing the department or contact.
5. Confirm the record using `list_students`.
6. Only when ready, explicitly confirm deletion of the test record and call `delete_student` with its `id`.

In MongoDB Atlas, open **Browse Collections** and look for `studentDB` → `students`.

## Security notes

- Do not upload `.env` or credentials to GitHub.
- This sample is for a local stdio MCP server; it is not publicly hosted on Render.
- Only connect it to MCP clients you trust.
- Deleting records is permanent. Confirm with the user before invoking `delete_student`.
- Add authentication/authorization and audit logging before adapting it for real student data.
