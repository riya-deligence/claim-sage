import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTrash,
  faPlus,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import SearchModal from "../modal/SearchModal";
import "./SideNavBar.css";

const SideNav = (props) => {
  const [activeItem, setActiveItem] = useState(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const toggleSidebar = () => {
    props.setIsOpen(!props.isOpen);
  };

  const handleItemClick = (id) => {
    props.setThreadId(id);
    setActiveItem(id);
    props.threadChat(id);
  };

  const confirmDelete = (itemId) => {
    setDeleteModal(true);
    setItemToDelete(itemId);
  };

  const createNewChat = async () => {
    try {
      props.setThreadId(null);
      props.setHasStarted(false);
    } catch (error) {
      console.error("Error creating a new thread:", error);
    }
  };

  const handleModalClose = () => setSearchModal(false);

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/thread/deleteThread", {
        method: "POST",
        body: itemToDelete,
      });
      if (response.ok) {
        setDeleteModal(false);
        setItemToDelete(null);
        props.setThreadId(null);
        props.setHasStarted(false);
        await props.fetchThreads();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete thread");
      }
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  return (
    <div className={`sideNav ${props.isOpen ? "" : "close"}`}>
      <div className="sidebarHeader">
        <button onClick={toggleSidebar} title="Close sidebar">
          <FontAwesomeIcon icon={props.isOpen ? faXmark : faBars} />
        </button>
        <div>
          <button className="searchIcon" onClick={() => setSearchModal(true)}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          <button onClick={createNewChat}>
            <FontAwesomeIcon icon={faPlus} />
          </button>
        </div>
      </div>
      <div className="sidebarContent">
        <ul>
          {props.listItems.map((item) => (
            <li
              key={item.id}
              className={activeItem === item.id ? "active" : ""}
              onClick={() => handleItemClick(item.id)}
            >
              {item.name.length > 25
                ? item.name.slice(0, 25) + "..."
                : item.name}
              {activeItem === item.id && (
                <button
                  className="deleteButton"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(item.id);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {searchModal && (
        <SearchModal
          isOpen={searchModal}
          onClose={handleModalClose}
          threadChat={props.threadChat}
          threads={props.listItems}
        />
      )}

      {deleteModal && (
        <div className="modal">
          <div className="modalContent">
            <p>Are you sure you want to delete this item?</p>
            <button onClick={handleDelete}>Yes, Delete</button>
            <button onClick={() => setDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideNav;
