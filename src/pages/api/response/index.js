import multiparty from "multiparty";
import OpenAI from "openai";
import fs from "fs";
import { saveChatNameToThread } from "../thread/index";

export const config = {
  api: {
    bodyParser: false,
  },
};

let previousFileId;

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form data:", err);
      res.status(500).json({ error: "Failed to parse form data" });
      return;
    }

    const query = fields.input?.[0]?.trim();
    const currentThread = fields.currentThread?.[0]?.trim();
    const newChat = fields.newChat?.[0]?.trim();
  

    if (!query && Object.keys(files).length == 0) {
      res.status(400).json({ error: "Query must be a non-empty string" });
      return;
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (Object.keys(files).length !== 0) {
        const file = await openai.files.create({
          file: fs.createReadStream(files.file[0].path),
          purpose: "assistants",
        });
      
        const fileId = file.id;

        const myThread = await openai.beta.threads.retrieve(currentThread);
        const vectorStoreIds =
          myThread.tool_resources?.file_search?.vector_store_ids || [];
        for (const vectorStoreId of vectorStoreIds) {
          await openai.beta.vectorStores.del(vectorStoreId);
        }
        const messageContent = query || "File upload";
        const metadata = files?.file[0]
          ? { fileName: files.file[0].originalFilename }
          : {};

        await openai.beta.threads.messages.create(currentThread, {
          role: "user",
          content: messageContent,
          attachments: [{ file_id: fileId, tools: [{ type: "file_search" }] }],
          metadata: metadata, 
        });

        if (previousFileId) {
          await openai.files.del(previousFileId);
        }

        previousFileId = fileId;
      } else {
        await openai.beta.threads.messages.create(currentThread, {
          role: "user",
          content: query,
        });
      }

      let assistantResponse = "";

      const run = openai.beta.threads.runs
        .stream(currentThread, {
          assistant_id: "asst_5dAkdiQcQrfFMrVDmZzbjEbI",
        })
        .on("textDelta", (textDelta) => {
          assistantResponse += textDelta.value;
          res.write(textDelta.value);
        })
        .on("toolCallDelta", (toolCallDelta) => {
          if (toolCallDelta.type === "code_interpreter") {
            if (toolCallDelta.code_interpreter.input) {
              res.write(toolCallDelta.code_interpreter.input);
            }
          }
        })
        .on("end", async () => {
          res.end();
          console.log(newChat, typeof newChat);
          if (newChat === "true") {
            console.log("iffff ");
            const generatedChatNameResponse =
              await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                  {
                    role: "system",
                    content:
                      "Generate a descriptive chat name based on the user's query and assistant's response. Only return the chat name, do not add any other prefix.",
                  },
                  {
                    role: "user",
                    content: `Query: ${query}\nAssistant Response: ${assistantResponse}`,
                  },
                ],
                max_tokens: 50,
              });

            const chatName =
              generatedChatNameResponse.choices[0]?.message?.content?.trim();
            await saveChatNameToThread(currentThread, chatName);
          }
        });
    } catch (error) {
      console.error("Error during streaming:", error);
      res.status(500).json({ error: "Failed to stream response" });
    }
  });
}

export default handler;
