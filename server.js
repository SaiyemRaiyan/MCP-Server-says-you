               // Let's Dive on the MCP server

    //Packages
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import   dotenv from "dotenv";
import { google } from "googleapis";
import { z } from "zod";

dotenv.config();

// Create the MCP server
const server = new McpServer({
  name: "Raiyan's Calendar",
  version: "10.9.3",
});

// Tool function (Controller Function)
async function getMyCalendarDataByDate(date) {
  const calendar = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_PUBLIC_API_KEY,  //create goole calender API key
  });

  // Calculate the start and end of the given date (UTC)
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  // Request to google calender and pass the ID
  try {
    const res = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = res.data.items || [];
    const meetings = events.map((event) => {
      const start = event.start.dateTime || event.start.date;
      return `${event.summary} at ${start}`;   //Event Command
    });

    if (meetings.length > 0) {
      return {
        meetings,
      };
    }
    else
    {
      return {
        meetings: [],
      };
    }
  }

  catch (err)
  {
    return {
      error: err.message,
    };
  }
}

// Register the tool to MCP
server.tool(
  "getMyCalendarDataByDate",
  {
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format. Please provide a valid date string.",
    }),
  },
  async ({ date }) => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(await getMyCalendarDataByDate(date)),
        },
      ],
    };
  }
);

// Set transfort
async function init() {
  const transport = new StdioServerTransport();  //Transport Create
  await server.connect(transport);  //Transport Connect with Server
}

// Call the initialization
init();
