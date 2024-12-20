import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const threadId = req.body;

  if (!threadId) {
    return res.status(400).json({ error: "Thread ID is required" });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = await openai.beta.threads.messages.list(threadId);
    const formattedMessages = messages.data
      .map((message) => {
        //   console.log(message);
        // console.log(message.content[0].text.value, "message");
        return {
          sender: message.role === "user" ? "user" : "bot",
          text: message.content[0].text.value, // Access the `text` field
        };
      })
      .reverse();

    // Display messages
    // console.log(formattedMessages);
    // console.log(messages);

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error("Error fetching thread:", error);
    res.status(500).json({ error: "Failed to fetch thread" });
  }
}
