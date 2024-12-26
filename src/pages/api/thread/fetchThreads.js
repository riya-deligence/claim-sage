import { getAllThreads } from "../thread/index";

export default async function handler(req, res) {
  try {
    const threads = await getAllThreads();

    res.status(200).json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
}
