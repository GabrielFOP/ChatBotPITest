"use client"
import React, { useRef, useState } from "react";

export default function Home(){
  
  interface Conversation{
    role: string
    content: string
  }


  const [value, setValue] = useState<string>("");
  const [conversation, setConversation] = useState<Conversation[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);


  const handleInput = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>{
      setValue(e.target.value)
    },
    []
  )

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) =>{
    if(e.key === "Enter"){
      const chatHistory = [...conversation, {role: "user", content: value}]
      const rersponse = await fetch("/api/openAIChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({messages: chatHistory}),
      })

      const data = await rersponse.json()
      setValue("")
      setConversation([
        ...chatHistory,{role: "assistant", content: data.result.choices[0].message.content}
      ])
    }
  }

  const handleRefresh = () => {
    inputRef.current?.focus()
    setValue("")
    setConversation([])
  }
  

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center w-2/3 mx-auto mt-40 text-center">
        <h1 className="text-6xl">Chat</h1>
      </div>
      <div className="my-12">
        <p className="mb-6 font-bold">Digite o prompt</p>
        <input
          placeholder="Digite aqui"
          className="w-full max-w-xs input input-bordered input-secondary"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
        />
        <button className="mt-6 btn btn-primary btn-xs" onClick={handleRefresh}>Nova conversa</button>
        <div className="textarea">
          {conversation.map((item, index) => (
            <React.Fragment key={index}>
              <br />
              {item.role === "assistant" ? (
                <div className="chat chat-end">
                  <div className="chat-bubble chat-bubble-secondary">
                    <strong className="badge badge-primary">GPT</strong>
                    <br />
                    {item.content}
                  </div>
                </div>
              ) : (
                <div className="chat chat-start">
                  <div className="chat-bubble chat-bubble-primary">
                    <strong className="badge badge-primary">Usuário</strong>
                    <br />
                    {item.content}
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}