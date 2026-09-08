"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  where,
} from "firebase/firestore";

type TicketStatus = "waiting" | "called" | "done";

interface Ticket {
  number: number;
  status: TicketStatus;
  createdAt?: any;
}

export default function ClientPage() {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<Ticket | null>(null);
  const [waitingCount, setWaitingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. 初回アクセス時にlocalStorageを確認
  useEffect(() => {
    const savedId = localStorage.getItem("festival_ticket_id");
    if (savedId) {
      setTicketId(savedId);
    }
    setIsLoading(false);
  }, []);

  // 2. 自分のチケットの監視
  useEffect(() => {
    if (!ticketId) return;

    const docRef = doc(db, "tickets", ticketId);
    const unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTicketData(docSnap.data() as Ticket);
      } else {
        localStorage.removeItem("festival_ticket_id");
        setTicketId(null);
        setTicketData(null);
      }
    });

    return () => unsubscribeDoc();
  }, [ticketId]);

  // 3. 待ち人数の監視
  useEffect(() => {
    if (!ticketData?.number) return;

    const waitingQuery = query(
      collection(db, "tickets"),
      where("status", "==", "waiting"),
    );
    const unsubscribeWaiting = onSnapshot(waitingQuery, (snapshot) => {
      const count = snapshot.docs.filter(
        (d) => (d.data() as Ticket).number < ticketData.number,
      ).length;
      setWaitingCount(count);
    });

    return () => unsubscribeWaiting();
  }, [ticketData?.number]);

  // 新規発券処理
  const issueTicket = async () => {
    setIsLoading(true);
    try {
      const ticketsRef = collection(db, "tickets");
      const q = query(ticketsRef, orderBy("number", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      let nextNumber = 1;
      if (!querySnapshot.empty) {
        nextNumber = (querySnapshot.docs[0].data() as Ticket).number + 1;
      }

      const docRef = await addDoc(ticketsRef, {
        number: nextNumber,
        status: "waiting",
        createdAt: serverTimestamp(),
      });

      localStorage.setItem("festival_ticket_id", docRef.id);
      setTicketId(docRef.id);
    } catch (error) {
      console.error("発券エラー:", error);
      alert("発券に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  // チケットをリセットする処理（新たな注文をする）
  const resetTicket = () => {
    localStorage.removeItem("festival_ticket_id");
    setTicketId(null);
    setTicketData(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        読み込み中...
      </div>
    );
  }

  // 【画面1】未発券（新規発券画面）
  if (!ticketId || !ticketData) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h1 className="text-2xl font-bold mb-8 text-gray-800">
          模擬店 整理券システム
        </h1>
        <button
          onClick={issueTicket}
          className="bg-blue-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          整理券を発券する
        </button>
      </main>
    );
  }

  // 【画面2】呼出中（完成時）
  if (ticketData.status === "called") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-red-500 p-4 text-white text-center animate-pulse">
        <h1 className="text-4xl font-extrabold mb-4">あなたの番です！</h1>
        <p className="text-xl mb-8">商品のお渡し口までお越しください</p>
        <div className="bg-white text-red-500 rounded-2xl p-8 shadow-2xl">
          <p className="text-sm font-bold mb-2">整理番号</p>
          <p className="text-7xl font-black">{ticketData.number}</p>
        </div>
      </main>
    );
  }

  // 【画面3】受渡完了（終了画面）
  if (ticketData.status === "done") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-200 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-md flex flex-col items-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ご利用ありがとうございました
          </h1>
          <p className="text-gray-600 mb-8">この整理券は受渡完了しました。</p>

          <button
            onClick={resetTicket}
            className="bg-gray-800 text-white font-bold py-3 px-8 rounded-full shadow-md active:scale-95 transition-transform"
          >
            新たな注文をする
          </button>
        </div>
      </main>
    );
  }

  // 【画面4】待機画面（waiting）
  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-6 pt-12 text-center">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-8 mb-8">
        <p className="text-gray-500 font-bold mb-2 text-sm">あなたの整理番号</p>
        <p className="text-7xl font-black text-gray-800 mb-6">
          {ticketData.number}
        </p>

        <div className="border-t border-gray-200 pt-6">
          <p className="text-gray-500 font-bold mb-1">現在の待ち組数</p>
          <p className="text-4xl font-bold text-blue-600">
            {waitingCount}{" "}
            <span className="text-xl text-gray-600 font-medium">組</span>
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 font-bold bg-yellow-100 py-3 px-4 rounded-lg">
        ※この画面は自動で更新されます。
        <br />
        閉じずにお待ちください。
      </p>
    </main>
  );
}
