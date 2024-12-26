import fs from "fs/promises";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data.json");

export default async function handler(req, res) {
  const itemToDelete = req.body;

  if (!itemToDelete) {
    return res.status(400).json({ error: "threadId is required" });
  }

  try {
    const data = JSON.parse(await fs.readFile(dataFilePath, "utf-8"));

    const updatedThreads = data.threads.filter(
      (thread) => thread.threadId !== itemToDelete
    );

    if (updatedThreads.length === data.threads.length) {
      return res.status(404).json({ error: "Thread not found" });
    }

    data.threads = updatedThreads;
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

    return res.status(200).json({ message: "Thread deleted successfully" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
