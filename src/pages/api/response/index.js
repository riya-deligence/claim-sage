

import multiparty from "multiparty";
import OpenAI from "openai";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // Required for multiparty to process file uploads
  },
};

// Global thread tracking
let globalThreadValue;
let previousFileId;

async function handler(req, res) {
  if (req.method === "POST") {
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error parsing form data:", err);
        res.status(500).json({ error: "Failed to parse form data" });
        return;
      }

      const query = fields.input[0];
      // console.log(query[0]);
      if (!query.trim()) {
        res.status(400).json({ error: "Query must be a non-empty string" });
        return;
      }

      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Retrieve assistant details
        const assistant = await openai.beta.assistants.retrieve(
          "asst_5dAkdiQcQrfFMrVDmZzbjEbI" // Replace with your assistant ID
        );

        // Ensure a single global thread
        if (!globalThreadValue) {
          const thread = await openai.beta.threads.create();
          globalThreadValue = thread.id;
        }

        const threadId = globalThreadValue;

        if (Object.keys(files).length !== 0) {
          // Handle file upload
          const file = await openai.files.create({
            file: fs.createReadStream(files.file[0].path),
            purpose: "assistants",
          });

          const fileId = file.id;

          // Remove old vector store if exists
          const myThread = await openai.beta.threads.retrieve(threadId);
          if (
            myThread.tool_resources &&
            myThread.tool_resources.file_search &&
            myThread.tool_resources.file_search.vector_store_ids
          ) {
            await openai.beta.vectorStores.del(
              myThread.tool_resources.file_search.vector_store_ids
            );
          }

          // Create message with file attachment
          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: query,
            attachments: [
              { file_id: fileId, tools: [{ type: "file_search" }] },
            ],
          });

          // Delete the previous file if necessary
          if (previousFileId) {
            await openai.files.del(previousFileId);
          }

          // Update global previous file ID
          previousFileId = fileId;
        } else {
          // Create a simple message without file attachment
          await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: query,
          });
        }

        const run = openai.beta.threads.runs
          .stream(threadId, {
            assistant_id: assistant.id,
          })
          .on("textCreated", (text) => {
            process.stdout.write("\nassistant > ");
            // process.stdout.write(text);
            console.log(text, "text");
            // res.write(`${text}`); // Send text to client
          })
          .on("textDelta", (textDelta, snapshot) => {
            process.stdout.write(textDelta.value);
            // process.stdout.write(textDelta.value);

            res.write(textDelta.value); // Stream partial responses
          })
          .on("toolCallCreated", (toolCall) => {
            process.stdout.write(`\nassistant > ${toolCall.type}\n\n`);
            // res.write(`\nassistant > ${toolCall.type}\n\n`);
          })
          .on("toolCallDelta", (toolCallDelta, snapshot) => {
            if (toolCallDelta.type === "code_interpreter") {
              if (toolCallDelta.code_interpreter.input) {
                process.stdout.write(toolCallDelta.code_interpreter.input);
                res.write(toolCallDelta.code_interpreter.input); // Stream code input
              }
              if (toolCallDelta.code_interpreter.outputs) {
                process.stdout.write("\noutput >\n");
                res.write("\noutput >\n");
                toolCallDelta.code_interpreter.outputs.forEach((output) => {
                  if (output.type === "logs") {
                    process.stdout.write(`\n${output.logs}\n`);
                    res.write(`\n${output.logs}\n`); // Stream logs
                  }
                });
              }
            }
          })
          .on("end", () => {
            res.end(); // Close the stream when complete
          });
      } catch (error) {
        console.error("Error during streaming:", error);
        res.status(500).json({ error: "Failed to stream response" });
      }
    });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default handler;
