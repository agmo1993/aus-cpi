"use client";
import { useState } from "react";
import Input from "../ui/input";
import Button from "../ui/button";
import styles from "./chat.module.css";

function Message({ text, fromUser }) {
  return (
    <div className={fromUser ? styles.messageUser : styles.messageBot}>
      {text}
    </div>
  );
}

export default function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState("");

  const sendMessage = () => {
    if (!value) return;
    setMessages([...messages, { text: value, fromUser: true }]);
    setMessages((prev) => [...prev, { text: `Echo: ${value}`, fromUser: false }]);
    setValue("");
  };

  return (
    <div className={styles.chatWindow}>
      <div className={styles.history}>
        {messages.map((m, i) => (
          <Message key={i} text={m.text} fromUser={m.fromUser} />
        ))}
      </div>
      <div className={styles.inputArea}>
        <Input
          placeholder="Type a message"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </div>
  );
}
