"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

type TicketStatus = "waiting" | "called" | "done";

interface Ticket {
  id: string;
  number: number;
  status: TicketStatus;
}

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("number", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Ticket, "id">),
      }));
      setTickets(ticketsData);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, newStatus: TicketStatus) => {
    try {
      const docRef = doc(db, "tickets", id);
      await updateDoc(docRef, { status: newStatus });
    } catch (error) {
      console.error("ステータス更新エラー:", error);
      alert("更新に失敗しました。");
    }
  };

  const resetAllData = async () => {
    const isConfirmed = window.confirm(
      "【警告】本当にすべての注文データを削除しますか？\nこの操作は取り消せません。",
    );

    if (!isConfirmed) return;

    try {
      const snapshot = await getDocs(collection(db, "tickets"));
      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      alert("すべての注文データをリセットしました。");
    } catch (error) {
      console.error("リセットエラー:", error);
      alert("データのリセットに失敗しました。");
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case "waiting":
        return (
          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
            待機中
          </span>
        );
      case "called":
        return (
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            呼出中
          </span>
        );
      case "done":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold">
            完了
          </span>
        );
    }
  };

  // ★ ここで「対応中」と「完了済み」を振り分けます
  const activeTickets = tickets.filter((t) => t.status !== "done");
  const doneTickets = tickets.filter((t) => t.status === "done");

  return (
    <main className="min-h-screen bg-gray-100 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black text-gray-800 mb-6 bg-white p-4 rounded-lg shadow-sm text-center">
          注文管理画面
        </h1>

        {/* 対応中（待機中・呼出中）のリスト */}
        <div className="space-y-4 mb-12">
          <h2 className="text-lg font-bold text-gray-700 border-b-2 border-gray-300 pb-2">
            対応中の注文 ({activeTickets.length}件)
          </h2>

          {activeTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border-l-8 border-blue-600"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black text-gray-800 w-12 text-center">
                  {ticket.number}
                </div>
                <div>{getStatusBadge(ticket.status)}</div>
              </div>

              <div>
                {ticket.status === "waiting" && (
                  <button
                    onClick={() => updateStatus(ticket.id, "called")}
                    className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md active:bg-blue-700"
                  >
                    完成（呼出）
                  </button>
                )}
                {ticket.status === "called" && (
                  <button
                    onClick={() => updateStatus(ticket.id, "done")}
                    className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg shadow-md active:bg-red-600"
                  >
                    完了（受渡済）
                  </button>
                )}
              </div>
            </div>
          ))}

          {activeTickets.length === 0 && (
            <p className="text-center text-gray-500 mt-6 font-bold">
              現在、対応待ちの注文はありません
            </p>
          )}
        </div>

        {/* 完了済みのリスト（不要なら折りたたむなどのアレンジも可能です） */}
        {doneTickets.length > 0 && (
          <div className="space-y-2 opacity-60">
            <h2 className="text-sm font-bold text-gray-500 pb-2">
              完了済みの注文 ({doneTickets.length}件)
            </h2>
            {doneTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-gray-200 p-3 rounded-lg flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-gray-600 w-8 text-center">
                    {ticket.number}
                  </div>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* リセットボタンエリア */}
        <div className="border-t border-gray-300 pt-8 mt-12 text-center">
          <button
            onClick={resetAllData}
            className="text-red-500 font-bold underline hover:text-red-700 p-2"
          >
            1日の終わりに全データをリセットする
          </button>
        </div>
      </div>
    </main>
  );
}
