"use client";

import { useState, useEffect, useRef } from "react";
import "./Chat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
  faTimes,
  faPaperclip,
  faFile,
  faUserCircle,
  faBars,
} from "@fortawesome/free-solid-svg-icons";
import ReactMarkdown from "react-markdown";
import SideNav from "./sideNavBar/SideNavBar";
import DotLoader from "react-spinners/DotLoader";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [hasStarted, setHasStarted] = useState(messages.length > 0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [file, setFile] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [rows, setRows] = useState(1);
  const [threadId, setThreadId] = useState(null);
  const lastMessageRef = useRef(null);
  const inputRef = useRef(null);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  const handleStarterMessageClick = (message) => {
    setHasStarted(true);
    setMessages([...messages, { sender: "user", text: message }]);
    handleSendMessage(message);
  };
  const fetchThreads = async () => {
    try {
      const response = await fetch("/api/thread/fetchThreads");

      const threadsList = await response.json();
      const threadListItems = threadsList.map((thread) => ({
        id: thread.threadId,
        name: thread.chatName,
      }));
      setListItems(threadListItems);
    } catch (error) {
      console.error("Error fetching threads:", error);
    }
  };

  const handleSendMessage = async (msg) => {
    setHasStarted(true);
    const API_URL = "/api/response";
    let message = msg;

    if (inputMessage.trim() !== "" || file) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: inputMessage.trim(),
          sender: "user",
          isFile: file ? true : false,
          fileName: file ? file.name : null,
        },
      ]);
      setInputMessage("");
      setFile(null);
      message = inputMessage;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("input", message);

    console.log(threadId);
    if (threadId === null) {
      const response = await fetch("/api/thread/createThread");

      const newThread = await response.json();

      setThreadId(newThread);

      formData.append("currentThread", newThread);
      formData.append("newChat", true);
      await fetchThreads();
    } else {
      formData.append("currentThread", threadId);
      formData.append("newChat", false);
    }
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
    await fetchThreads();
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };
  async function threadChat(id) {
    try {
      if (id !== null) {
        setFetching(true);
        const response = await fetch("/api/thread/getThreadChat", {
          method: "POST",
          body: id,
        });

        const data = await response.json();

        setMessages(data);

        setHasStarted(data.length > 0);
        setFetching(false);
      }
    } catch (error) {
      console.error("Error during the request", error);
    }
  }
  const handleFileRemove = () => {
    setFile(null);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOpen(window.innerWidth >= 768);
    }
  }, []);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const starterMessages = [
    "Can you review this policy and tell me if my claim is valid?",
    "What are my legal rights regarding property insurance?",
    "How can I dispute a denial from my insurance company?",
    "What does this clause in my policy mean?",
  ];

  const calculateRows = () => {
    if (inputRef.current && inputMessage) {
      const maxRows = 5;
      const inputElement = inputRef.current;

      const fontSize = parseFloat(getComputedStyle(inputElement).fontSize);
      const inputWidth = inputElement.offsetWidth;

      const charsPerRow = Math.floor(inputWidth / (fontSize * 0.6));
      const messageLength = inputMessage.length;

      return Math.min(Math.ceil(messageLength / charsPerRow), maxRows);
    }
    return 1;
  };

  useEffect(() => {
    setRows(calculateRows());
  }, [inputMessage]);

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!hasStarted) setMessages([]);
  }, [hasStarted]);

  const truncateFileName = (name) => {
    const maxLength = 40;
    return name.length > maxLength ? `${name.slice(0, maxLength)}...` : name;
  };

  return (
    <div className="chatbotContainer">
      {isOpen ? (
        <SideNav
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          setThreadId={setThreadId}
          setHasStarted={setHasStarted}
          listItems={listItems}
          fetchThreads={fetchThreads}
          threadChat={threadChat}
        />
      ) : (
        <button className="toggleSidebarButton" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      )}
      <div className="chatWindow">
        <div className="chatHeader">
          <div className="headerContent">
            <span className="chatTitle">Claim Sage</span>
          </div>
          <button className="profileButton">
            <FontAwesomeIcon icon={faUserCircle} />
          </button>
        </div>
        <div className="chatContainer">
          {fetching ? (
            <div className="loader">
              <DotLoader color="#137cc4" size={40} />
            </div>
          ) : (
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
                    {message.sender === "bot" ? (
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                    ) : message.isFile === true ? (
                      <>
                        <div className="fileAttachment">
                          <FontAwesomeIcon icon={faFile} className="fileIcon" />
                          <span>{message.fileName}</span>
                        </div>
                        {message.text !== null && <span>{message.text}</span>}
                      </>
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
                <>
                  <div className="messageContainer">
                    <div className="iconContainer">
                      <img
                        src="/images/logo-sage.png"
                        alt="Bot Icon"
                        className="botIcon"
                      />
                    </div>
                    <div className="messageContent">
                      <p>Claim Sage</p>
                      <span className="botDescription">
                        Expert property insurance advocate providing
                        pro-consumer advice.
                      </span>
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
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <div className={isOpen ? "sidebarOpen" : "sidebarClose"}>
            <div className="chatInputContainer">
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
                  ref={inputRef}
                  className="chatInput"
                  placeholder="Message Claim Sage"
                  value={inputMessage}
                  onChange={handleInputChange}
                  rows={rows}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
              </div>
              <div className="inputButtonWrapper">
                <label className="fileUpload">
                  <FontAwesomeIcon
                    icon={faPaperclip}
                    className="fileUploadIcon"
                  />
                  <input
                    type="file"
                    className="fileInput"
                    onChange={handleFileInputChange}
                  />
                </label>

                <button className="sendButton" onClick={handleSendMessage}>
                  <FontAwesomeIcon
                    icon={faPaperPlane}
                    className="sendArrowIcon"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
