// // import OpenAI from "openai";

// // async function createThread() {
// //   const openai = new OpenAI({
// //     apiKey: process.env.OPENAI_API_KEY,
// //   });
// //   const thread = await openai.beta.threads.create();
// //   return thread.id;
// // }

// // export { createThread };

// import fs from "fs/promises";
// import path from "path";
// import OpenAI from "openai";

// const THREAD_FILE_PATH = path.resolve("data.json"); // Path to store the threads

// // Create a new thread and save it in the file
// async function createThread() {
//   const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY,
//   });

//   const thread = await openai.beta.threads.create();
//   const threadId = thread.id;

//   // Load existing thread IDs
//   let data = { threadIds: [] };
//   try {
//     const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
//     data = JSON.parse(fileData);
//   } catch {
//     // No existing file, create a new one
//     console.log("No existing data.json file found. Creating a new one.");
//   }

//   // Add the new thread ID and save back to the file
//   data.threadIds.push(threadId);
//   await fs.writeFile(THREAD_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");

//   return threadId;
// }

// // Retrieve the last thread ID from the file
// async function getLastThread() {
//   try {
//     const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
//     const data = JSON.parse(fileData);

//     const threadIds = data.threadIds || [];
//     return threadIds.length > 0 ? threadIds[threadIds.length - 1] : null;
//   } catch (error) {
//     console.error("Error reading thread IDs:", error);
//     return null;
//   }
// }

// export { createThread, getLastThread };

import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const THREAD_FILE_PATH = path.resolve("data.json"); // Path to store the threads

// Create a new thread and save it in the file
async function createThread() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create a new thread
  const thread = await openai.beta.threads.create();
  const threadId = thread.id;

  // Load existing thread data or initialize an empty structure
  let data = { threads: [] };
  try {
    const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
    data = JSON.parse(fileData);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Error reading thread file:", error);
      throw error; // Only rethrow if it's not a "file not found" error
    }
    console.log("No existing data.json file found. Creating a new one.");
  }

  // Append the new thread ID
  data.threads.push({ threadId, chatName: "" }); // Initialize with an empty chatName

  // Save updated data back to the file
  await fs.writeFile(THREAD_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");

  console.log(`New thread created with ID: ${threadId}`);
  return threadId;
}

// Retrieve the last thread ID from the file
async function getLastThread() {
  try {
    const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
    const data = JSON.parse(fileData);

    const threads = data.threads || [];
    return threads.length > 0 ? threads[threads.length - 1].threadId : null;
  } catch (error) {
    console.error("Error reading thread IDs:", error);
    return null;
  }
}

// Save the chat name to a specific thread in the file
async function saveChatNameToThread(threadId, chatName) {
  try {
    // Load existing thread data
    const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
    const data = JSON.parse(fileData);

    const threadIndex = data.threads.findIndex(
      (thread) => thread.threadId === threadId
    );
    if (threadIndex === -1) {
      console.error("Thread not found!");
      return;
    }
    let name = JSON.parse(chatName);
    // Update the chat name for the specified thread
    data.threads[threadIndex].chatName = name;

    // Save the updated data back to the file
    await fs.writeFile(
      THREAD_FILE_PATH,
      JSON.stringify(data, null, 2),
      "utf-8"
    );
  } catch (error) {
    console.error("Error saving chat name to thread:", error);
  }
}

// Retrieve all threads with their chatName and threadId for sidebar display
async function getAllThreads() {
  try {
    const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
    const data = JSON.parse(fileData);

    // Extract threadId and chatName for each thread
    const threads = data.threads || [];
    return threads.map((thread) => ({
      threadId: thread.threadId,
      chatName: thread.chatName,
    }));
  } catch (error) {
    console.error("Error retrieving all threads:", error);
    return [];
  }
}

export {createThread, getLastThread, saveChatNameToThread, getAllThreads };
