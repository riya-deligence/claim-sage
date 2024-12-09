"use client";

import { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faCommentDots,
  faTimes,
  faPaperclip,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "Hello! How can I assist you today? You can start by clicking on any option or typing your question below.",
      sender: "bot",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const lastMessageRef = useRef(null);

  const toggleChatbot = () => setIsOpen(!isOpen);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleStarterMessageClick = (message) => {
    setHasStarted(true);
    setMessages([...messages, { sender: "user", text: message }]);
    handleSendMessage(message);
  };

  const handleSendMessage = async (msg) => {
    setHasStarted(true);

    const API_URL = "/api/response";
    let message = msg;

    if (inputMessage.trim() !== "" || file) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: inputMessage.trim() || "[File Attached]",
          sender: "user",
          file: file ? file.name : null,
        },
      ]);
      setInputMessage("");
      setFile(null);
      message = inputMessage;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("input", message);

    if (file) {
      formData.append("file", file);
    }

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        console.error("Error with the request");
        setLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resultText += decoder.decode(value, { stream: true });

        if (resultText) {
          setLoading(false);
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage?.sender === "bot") {
              return prevMessages.map((m, index) =>
                index === prevMessages.length - 1
                  ? { ...m, text: resultText }
                  : m
              );
            } else {
              return [...prevMessages, { text: resultText, sender: "bot" }];
            }
          });
        }
      }
    } catch (error) {
      console.error("Error during the request", error);
    }

    setLoading(false);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const starterMessages = [
    "Can you review this policy and tell me if my claim is valid?",
    "What are my legal rights regarding property insurance?",
    "How can I dispute a denial from my insurance company?",
    "What does this clause in my policy mean?",
  ];

  const calculateRows = () => {
    if (inputMessage || file) {
      return Math.min(Math.ceil(inputMessage.length / 30), 5);
    }
    return 1;
  };

  const truncateFileName = (name) => {
    const maxLength = 40;
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  return (
    <div className={`chatbotContainer ${isOpen ? "open" : ""}`}>
      <div className="chatButton" onClick={toggleChatbot}>
        {isOpen ? (
          <FontAwesomeIcon icon={faTimes} className="iconStyle" />
        ) : (
          <FontAwesomeIcon icon={faCommentDots} className="iconStyle" />
        )}
      </div>
      {isOpen && (
        <div className="chatWindow">
          <div className="chatHeader">
            <div className="headerContent">
              <span className="chatTitle">Claim Sage</span>
              <span className="chatSubtitle">
                Your Property Insurance Expert for Pro-Consumer Advice
              </span>
            </div>
            <button className="closeButton" onClick={toggleChatbot}>
              ×
            </button>
          </div>

          <div className="chatBody">
            {messages.map((message, index) => (
              <div
                key={index}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`chatBubble ${
                  message.sender === "user" ? "user" : "bot"
                }`}
              >
                <div className="messageIconContainer">
                  <img
                    src={
                      message.sender === "user"
                        ? "/images/logo-user.png"
                        : "/images/logo-sage.png"
                    }
                    alt={
                      message.sender === "user"
                        ? "User Icon"
                        : "Claim Sage Logo"
                    }
                    className="messageIcon"
                  />
                </div>
                <div
                  className={`messageText ${
                    message.sender === "user" ? "user" : "bot"
                  }`}
                >
                  {message.file && (
                    <div className="fileAttachment">
                      <FontAwesomeIcon icon={faFile} className="fileIcon" />
                      <span>{message.file}</span>
                    </div>
                  )}
                  {message.sender === "bot" ? (
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  ) : (
                    <span>{message.text}</span>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatBubble bot" ref={lastMessageRef}>
                <div className="messageIconContainer">
                  <img
                    src="/images/logo-sage.png"
                    alt="Bot Icon"
                    className="messageIcon"
                  />
                </div>
                <div className="loadingDots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </div>
              </div>
            )}
            {!hasStarted && (
              <div className="starterMessages">
                {starterMessages.map((message, index) => (
                  <button
                    key={index}
                    className="starterMessage"
                    onClick={() => handleStarterMessageClick(message)}
                  >
                    {message}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="chatInputContainer">
            <label className="fileUpload">
              <FontAwesomeIcon icon={faPaperclip} className="fileUploadIcon" />
              <input
                type="file"
                className="fileInput"
                onChange={handleFileInputChange}
              />
            </label>

            <div className="inputWrapper">
              {file && (
                <div className="fileNameContainer">
                  <span className="fileName">
                    {truncateFileName(file.name)}
                    <button
                      className="removeFileButton"
                      onClick={handleFileRemove}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </span>
                </div>
              )}

              <textarea
                className="chatInput"
                placeholder="Message Claim Sage"
                value={inputMessage}
                onChange={handleInputChange}
                rows={calculateRows()}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
            </div>

            <button className="sendButton" onClick={handleSendMessage}>
              <FontAwesomeIcon icon={faPaperPlane} className="sendArrowIcon" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
