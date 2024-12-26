import React, { useState } from "react";
import "./SearchModal.css";

const SearchModal = ({ isOpen, onClose, threads, threadChat }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = threads.filter((thread) =>
    thread.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  return (
    <div className={`modal-overlay ${isOpen ? "show" : ""}`} onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>

        <input
          type="text"
          placeholder="Search..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <ul className="threads-list">
          {filteredThreads.length > 0 ? (
            filteredThreads.map((thread, index) => (
              <li
                key={index}
                className="thread-item"
                onClick={() => {
                  threadChat(thread.id);
                  onClose();
                }}
              >
                {thread.name}
              </li>
            ))
          ) : (
            <li className="no-results">No threads found</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default SearchModal;
