// // import multiparty from "multiparty";
// // import OpenAI from "openai";
// // import fs from "fs";

// // import { createThread } from "../thread";

// // export const config = {
// //   api: {
// //     bodyParser: false,
// //   },
// // };

// // let globalThreadValue;
// // let previousFileId;

// // async function handler(req, res) {
// //   if (req.method === "POST") {
// //     const form = new multiparty.Form();

// //     form.parse(req, async (err, fields, files) => {
// //       if (err) {
// //         console.error("Error parsing form data:", err);
// //         res.status(500).json({ error: "Failed to parse form data" });
// //         return;
// //       }

// //       const query = fields.input[0];

// //       if (!query.trim()) {
// //         res.status(400).json({ error: "Query must be a non-empty string" });
// //         return;
// //       }

// //       try {
// //         const openai = new OpenAI({
// //           apiKey: process.env.OPENAI_API_KEY,
// //         });

// //         // Retrieve assistant details
// //         const assistant = await openai.beta.assistants.retrieve(
// //           "asst_5dAkdiQcQrfFMrVDmZzbjEbI"
// //         );

// //         // Ensure a single global thread
// //         if (!globalThreadValue) {
// //           globalThreadValue = await createThread();
// //         }
// //         console.log(globalThreadValue);
// //         const threadId = globalThreadValue;

// //         if (Object.keys(files).length !== 0) {
// //           // Handle file upload
// //           const file = await openai.files.create({
// //             file: fs.createReadStream(files.file[0].path),
// //             purpose: "assistants",
// //           });

// //           const fileId = file.id;

// //           // Remove old vector store if exists
// //           const myThread = await openai.beta.threads.retrieve(threadId);
// //           if (
// //             myThread.tool_resources &&
// //             myThread.tool_resources.file_search &&
// //             myThread.tool_resources.file_search.vector_store_ids
// //           ) {
// //             await openai.beta.vectorStores.del(
// //               myThread.tool_resources.file_search.vector_store_ids
// //             );
// //           }

// //           // Create message with file attachment
// //           await openai.beta.threads.messages.create(threadId, {
// //             role: "user",
// //             content: query,
// //             attachments: [
// //               { file_id: fileId, tools: [{ type: "file_search" }] },
// //             ],
// //           });

// //           // Delete the previous file if necessary
// //           if (previousFileId) {
// //             await openai.files.del(previousFileId);
// //           }

// //           // Update global previous file    ID
// //           previousFileId = fileId;
// //         } else {
// //           // Create a simple message without file attachment
// //           await openai.beta.threads.messages.create(threadId, {
// //             role: "user",
// //             content: query,
// //           });
// //         }

// //         const run = openai.beta.threads.runs
// //           .stream(threadId, {
// //             assistant_id: assistant.id,
// //           })

// //           .on("textDelta", (textDelta, snapshot) => {
// //             res.write(textDelta.value); // Stream partial responses
// //           })

// //           .on("toolCallDelta", (toolCallDelta, snapshot) => {
// //             if (toolCallDelta.type === "code_interpreter") {
// //               if (toolCallDelta.code_interpreter.input) {
// //                 res.write(toolCallDelta.code_interpreter.input); // Stream code input
// //               }
// //             }
// //           })
// //           .on("end", () => {
// //             res.end();
// //           });
// //       } catch (error) {
// //         console.error("Error during streaming:", error);
// //         res.status(500).json({ error: "Failed to stream response" });
// //       }
// //     });
// //   } else {
// //     res.status(405).json({ error: "Method not allowed" });
// //   }
// // }

// // export default handler;

// import multiparty from "multiparty";
// import OpenAI from "openai";
// import fs from "fs";
// import { createThread, getLastThread } from "../thread";

// export const config = {
//   api: {
//     bodyParser: false, // Required for multiparty to process file uploads
//   },
// };

// let previousFileId; // Track previous file for cleanup

// async function handler(req, res) {
//   if (req.method !== "POST") {
//     res.status(405).json({ error: "Method not allowed" });
//     return;
//   }

//   const form = new multiparty.Form();

//   form.parse(req, async (err, fields, files) => {
//     if (err) {
//       console.error("Error parsing form data:", err);
//       res.status(500).json({ error: "Failed to parse form data" });
//       return;
//     }

//     const query = fields.input?.[0]?.trim();
//     if (!query) {
//       res.status(400).json({ error: "Query must be a non-empty string" });
//       return;
//     }

//     try {
//       const openai = new OpenAI({
//         apiKey: process.env.OPENAI_API_KEY,
//       });

//       // Retrieve assistant details
//       const assistant = await openai.beta.assistants.retrieve(
//         "asst_5dAkdiQcQrfFMrVDmZzbjEbI" // Replace with your assistant ID
//       );

//       // Get the last thread or create a new one
//       let threadId = await getLastThread();
//       if (!threadId) {
//         threadId = await createThread();
//       }
//       console.log("Using thread ID:", threadId);

//       if (Object.keys(files).length !== 0) {
//         // Handle file upload
//         const file = await openai.files.create({
//           file: fs.createReadStream(files.file[0].path),
//           purpose: "assistants",
//         });

//         const fileId = file.id;

//         // Remove old vector store if exists
//         const myThread = await openai.beta.threads.retrieve(threadId);
//         const vectorStoreIds =
//           myThread.tool_resources?.file_search?.vector_store_ids || [];
//         for (const vectorStoreId of vectorStoreIds) {
//           await openai.beta.vectorStores.del(vectorStoreId);
//         }

//         // Create message with file attachment
//         await openai.beta.threads.messages.create(threadId, {
//           role: "user",
//           content: query,
//           attachments: [
//             { file_id: fileId, tools: [{ type: "file_search" }] },
//           ],
//         });

//         // Delete the previous file if necessary
//         if (previousFileId) {
//           await openai.files.del(previousFileId);
//         }

//         // Update global previous file ID
//         previousFileId = fileId;
//       } else {
//         // Create a simple message without file attachment
//         await openai.beta.threads.messages.create(threadId, {
//           role: "user",
//           content: query,
//         });
//       }

//       const run = openai.beta.threads.runs
//         .stream(threadId, {
//           assistant_id: assistant.id,
//         })
//         .on("textDelta", (textDelta) => {
//           res.write(textDelta.value); // Stream partial responses
//         })
//         .on("toolCallDelta", (toolCallDelta) => {
//           if (toolCallDelta.type === "code_interpreter") {
//             if (toolCallDelta.code_interpreter.input) {
//               res.write(toolCallDelta.code_interpreter.input); // Stream code input
//             }
//           }
//         })
//         .on("end", () => {
//           res.end();
//         });
//     } catch (error) {
//       console.error("Error during streaming:", error);
//       res.status(500).json({ error: "Failed to stream response" });
//     }
//   });
// }

// export default handler;

import multiparty from "multiparty";
import OpenAI from "openai";
import fs from "fs";
import { createThread,getLastThread, saveChatNameToThread } from "../thread/index";
// import createThread from "../thread/newThread";

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
    if (!query) {
      res.status(400).json({ error: "Query must be a non-empty string" });
      return;
    }

    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      // console.log(currentThread, typeof currentThread);
      // console.log("Generated chat name:", chatName);
      let threadId;
      if (currentThread !== "null") {
        threadId = currentThread;
      } else {
       
        threadId = await createThread();
        // console.log(threadId);
        const generatedChatNameResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Generate a descriptive chat name based on the user's query.",
            },
            {
              role: "user",
              content: query,
            },
          ],
          max_tokens: 50,
        });

        const chatName =
          generatedChatNameResponse.choices[0]?.message?.content?.trim();
        // console.log(chatName, threadId);
        await saveChatNameToThread(threadId, chatName);
      }
      // }
      if (Object.keys(files).length !== 0) {
        const file = await openai.files.create({
          file: fs.createReadStream(files.file[0].path),
          purpose: "assistants",
        });

        const fileId = file.id;

        const myThread = await openai.beta.threads.retrieve(threadId);
        const vectorStoreIds =
          myThread.tool_resources?.file_search?.vector_store_ids || [];
        for (const vectorStoreId of vectorStoreIds) {
          await openai.beta.vectorStores.del(vectorStoreId);
        }

        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: query,
          attachments: [{ file_id: fileId, tools: [{ type: "file_search" }] }],
        });

        if (previousFileId) {
          await openai.files.del(previousFileId);
        }

        previousFileId = fileId;
      } else {
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: query,
        });
      }

      const run = openai.beta.threads.runs
        .stream(threadId, {
          assistant_id: "asst_5dAkdiQcQrfFMrVDmZzbjEbI",
        })
        .on("textDelta", (textDelta) => {
          res.write(textDelta.value);
        })
        .on("toolCallDelta", (toolCallDelta) => {
          if (toolCallDelta.type === "code_interpreter") {
            if (toolCallDelta.code_interpreter.input) {
              res.write(toolCallDelta.code_interpreter.input);
            }
          }
        })
        .on("end", () => {
          res.end();
        });
    } catch (error) {
      console.error("Error during streaming:", error);
      res.status(500).json({ error: "Failed to stream response" });
    }
  });
}

export default handler;
