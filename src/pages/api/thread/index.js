import fs from "fs/promises";
import path from "path";
import OpenAI from "openai";

const THREAD_FILE_PATH = path.resolve("data.json");

// Create a new thread and save it in the file
async function createThread() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const thread = await openai.beta.threads.create();
  const threadId = thread.id;

  let data = { threads: [] };
  try {
    const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
    data = JSON.parse(fileData);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Error reading thread file:", error);
      throw error;
    }
    console.log("No existing data.json file found. Creating a new one.");
  }

  // Append the new thread ID
  data.threads.push({ threadId, chatName: "New Chat" });

  // Save updated data back to the file
  await fs.writeFile(THREAD_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");

  return threadId;
}

async function saveChatNameToThread(threadId, chatName) {
  try {
    const fileData = await fs.readFile(THREAD_FILE_PATH, "utf-8");
    const data = JSON.parse(fileData);

    const threadIndex = data.threads.findIndex(
      (thread) => thread.threadId === threadId
    );
    if (threadIndex === -1) {
      console.error("Thread not found!");
      return;
    }

    let name;

    try {
      name = JSON.parse(chatName);
    } catch (e) {
      name = chatName;
    }
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

export { createThread, saveChatNameToThread, getAllThreads };
