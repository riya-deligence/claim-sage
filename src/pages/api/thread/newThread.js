// import fs from "fs/promises";
// import path from "path";
// import OpenAI from "openai";

// const THREAD_FILE_PATH = path.resolve("data.json");
// export default async function createThread(req, res) {
//   try {
//     const openai = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });
//     console.log("creating new thread ");
//     // Create a new thread
//     const thread = await openai.beta.threads.create();
//     const threadId = thread.id;

//     // Load existing thread data or initialize an empty structure
//     let data = { threads: [] };
//     try {
//       const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
//       data = JSON.parse(fileData);
//     } catch (error) {
//       if (error.code !== "ENOENT") {
//         console.error("Error reading thread file:", error);
//         throw error; // Only rethrow if it's not a "file not found" error
//       }
//       console.log("No existing data.json file found. Creating a new one.");
//     }

//     // Append the new thread ID
//     data.threads.push({ threadId, chatName: "" }); // Initialize with an empty chatName

//     // Save updated data back to the file
//     await fs.writeFile(
//       THREAD_FILE_PATH,
//       JSON.stringify(data, null, 2),
//       "utf-8"
//     );

//     console.log(`New thread created with ID: ${threadId}`);
//     res.status(200).json(threadId);
//     // return threadId;
//   } catch (error) {
//     console.error("Error fetching threads:", error);
//     res.status(500).json({ error: "Failed to fetch threads" });
//   }
// }

import { createThread } from "./index";

export default async function createThreadCore(req, res) {
  try {
    const threadId = await createThread(); // Call core logic
    res.status(200).json( threadId ); // Send response to client
  } catch (error) {
    res.status(500).json({ error: "Failed to create thread" });
  }
}
