// import React, { useState, useEffect } from "react";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faBars,
//   faTrash,
//   faPenToSquare,
//   faMagnifyingGlass,
// } from "@fortawesome/free-solid-svg-icons";
// import SearchModal from "../modal/SearchModal";
// import "./SideNavBar.css";

// const SideNav = (props) => {
//   const [activeItem, setActiveItem] = useState(null);
//   const [listItems, setListItems] = useState([]);
//   const [deleteModal, setDeleteModal] = useState(false);
//   const [searchModal, setSearchModal] = useState(false);

//   const [itemToDelete, setItemToDelete] = useState(null);

//   const toggleSidebar = () => {
//     props.setIsOpen(!props.isOpen);
//   };

//   const handleItemClick = (id) => {
//     setActiveItem(id);
//   };

//   const confirmDelete = (itemId) => {
//     setDeleteModal(true);
//     setItemToDelete(itemId);
//   };

//   const createNewChat = async () => {
//     try {
//       await fetch("/api/thread/newThread");
//     } catch (error) {
//       console.error("Error fetching threads:", error);
//     }
//   };
//   const array = [
//     { id: 1, name: "Home" },
//     { id: 2, name: "About Our Amazing Company and Services in Detail" },
//     { id: 3, name: "Services" },
//     { id: 4, name: "Contact" },
//     { id: 5, name: "Home" },
//     { id: 6, name: "About Our Amazing Company and Services in Detail" },
//     { id: 7, name: "Services" },
//     { id: 8, name: "Contact" },
//     { id: 9, name: "Home" },
//     { id: 10, name: "About Our Amazing Company and Services in Detail" },
//     { id: 11, name: "Services" },
//     { id: 12, name: "Contact" },
//     { id: 13, name: "Home" },
//     { id: 14, name: "About Our Amazing Company and Services in Detail" },
//     { id: 15, name: "Services" },
//     { id: 16, name: "Contact" },
//   ];
//   const deleteItem = () => {
//     setListItems(listItems.filter((item) => item.id !== itemToDelete));
//     setDeleteModal(false);
//     setItemToDelete(null);
//   };

//   const handleModalClose = () => setSearchModal(false);

//   useEffect(() => {
//     // Fetch the threads dynamically and update the state
//     const fetchThreads = async () => {
//       try {
//         const threads = await fetch("/api/chatname");

//         const threadsList = await threads.json();

//         const threadListItems = threadsList.map((thread) => ({
//           id: thread.threadId,
//           name: thread.chatName,
//         }));

//         setListItems(threadListItems);
//       } catch (error) {
//         console.error("Error fetching threads:", error);
//       }
//     };

//     fetchThreads();
//   }, []);

//   return (
//     <div className={`sideNav ${props.isOpen ? "" : "close"}`}>
//       <div className="sidebarHeader">
//         <button onClick={toggleSidebar}>
//           <FontAwesomeIcon icon={faBars} />
//         </button>
//         <div>
//           <button className="searchIcon" onClick={() => setSearchModal(true)}>
//             <FontAwesomeIcon icon={faMagnifyingGlass} />
//           </button>
//           <button onClick={createNewChat}>
//             <FontAwesomeIcon icon={faPenToSquare} />
//           </button>
//         </div>
//       </div>
//       <div className="sidebarContent">
//         <ul>
//           {listItems.map((item) => (
//             <li
//               key={item.id}
//               className={activeItem === item.id ? "active" : ""}
//               onClick={() => handleItemClick(item.id)}
//             >
//               {item.name.length > 25
//                 ? item.name.slice(0, 25) + "..."
//                 : item.name}
//               {activeItem === item.id && (
//                 <button
//                   className="deleteButton"
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     confirmDelete(item.id);
//                   }}
//                 >
//                   <FontAwesomeIcon icon={faTrash} />
//                 </button>
//               )}
//             </li>
//           ))}
//         </ul>
//       </div>
//       {searchModal && (
//         <SearchModal
//           isOpen={searchModal}
//           onClose={handleModalClose}
//           threads={array}
//         />
//       )}

//       {deleteModal && (
//         <div className="modal">
//           <div className="modalContent">
//             <p>Are you sure you want to delete this item?</p>
//             <button onClick={deleteItem}>Yes, Delete</button>
//             <button onClick={() => setDeleteModal(false)}>Cancel</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SideNav;

import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faTrash,
  faPenToSquare,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import SearchModal from "../modal/SearchModal";
import "./SideNavBar.css";
// import { threadId } from "worker_threads";

const SideNav = (props) => {
  const [activeItem, setActiveItem] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [deleteModal, setDeleteModal] = useState(false);
  const [searchModal, setSearchModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const toggleSidebar = () => {
    props.setIsOpen(!props.isOpen);
  };

  const handleItemClick = (id) => {
    // console.log(id);
    // localStorage.setItem("threadId", id);
    props.setThreadId(id);
    setActiveItem(id);
  };

  const confirmDelete = (itemId) => {
    setDeleteModal(true);
    setItemToDelete(itemId);
  };

  const createNewChat = async () => {
    try {
      const response = await fetch("/api/thread/newThread", {
        method: "POST",
      });
      // console.log(response);
      const data = await response.json();
      props.setThreadId(data);
      props.setHasStarted(false);

      // console.log(data);
      await fetchThreads(); // Refetch the updated threads after creating a new thread
    } catch (error) {
      console.error("Error creating a new thread:", error);
    }
  };

  const deleteItem = async () => {
    try {
      // Assuming the API supports deleting threads
      await fetch(`/api/thread/${itemToDelete}`, { method: "DELETE" });
      setListItems(listItems.filter((item) => item.id !== itemToDelete));
      setDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleModalClose = () => setSearchModal(false);

  const fetchThreads = async () => {
    try {
      const response = await fetch("/api/chatname");
      // console.log(response);
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
  // console.log(props.hasStarted);
  useEffect(() => {
    fetchThreads(); // Fetch threads on component mount
  }, [props.hasStarted]);

  return (
    <div className={`sideNav ${props.isOpen ? "" : "close"}`}>
      <div className="sidebarHeader">
        <button onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faBars} />
        </button>
        <div>
          <button className="searchIcon" onClick={() => setSearchModal(true)}>
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          <button onClick={createNewChat}>
            <FontAwesomeIcon icon={faPenToSquare} />
          </button>
        </div>
      </div>
      <div className="sidebarContent">
        <ul>
          {listItems.map((item) => (
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
          threads={listItems} // Pass the updated listItems to the modal
        />
      )}

      {deleteModal && (
        <div className="modal">
          <div className="modalContent">
            <p>Are you sure you want to delete this item?</p>
            <button onClick={deleteItem}>Yes, Delete</button>
            <button onClick={() => setDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SideNav;
