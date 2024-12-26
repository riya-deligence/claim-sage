import { createThread } from "../thread/index";

export default async function handler(req, res) {
  try {
    const thread = await createThread();

    res.status(200).json(thread);
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
}
