"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Webcam from "react-webcam";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { useUser } from "@clerk/nextjs";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import moment from "moment";

function RecordAnswerSection({ mockInterviewQuestion, activeQuestionIndex, interviewData }) {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    if (results?.length) {
      results.forEach((result) => {
        setUserAnswer((prevAns) => prevAns + result?.transcript);
      });
    }
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      UpdateUserAnswer();
    }
  }, [userAnswer]);

  const StartStopRecording = async () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    try {
      const questionText = mockInterviewQuestion[activeQuestionIndex]?.Question; // Updated key access for question
      const correctAnswer = mockInterviewQuestion[activeQuestionIndex]?.Answer; // Updated key access for answer

      if (!questionText) {
        console.error("Question is missing for the current index:", activeQuestionIndex);
        toast("Error: Question is missing.");
        return;
      }

      setLoading(true);
      console.log("User Answer:", userAnswer);

      const feedbackPrompt = `
        Question: ${questionText},
        User Answer: ${userAnswer}.
        Please provide a rating and feedback in JSON format for the answer based on the question.
        The JSON should include "rating" and "feedback".
      `;

      const result = await chatSession.sendMessage(feedbackPrompt);

      const mockJsonResp = result.response.text().replace("```json", "").replace("```", "");
      console.log("AI Feedback Response:", mockJsonResp);

      const JsonFeedbackResp = JSON.parse(mockJsonResp);

      const insertData = {
        mockIdRef: interviewData?.mockId,
        question: questionText,
        correctAns: correctAnswer || "",
        userAns: userAnswer,
        feedback: JsonFeedbackResp?.feedback || "No feedback provided.",
        rating: JsonFeedbackResp?.rating || "N/A",
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      };

      console.log("Insert Data:", insertData);

      const resp = await db.insert(UserAnswer).values(insertData);

      if (resp) {
        toast("User Answer recorded successfully.");
        setResults([]);
      }

      setUserAnswer(""); // Clear the current answer
    } catch (error) {
      console.error("Error updating user answer:", error);
      toast("Failed to record the answer.");
    } finally {
      setResults([]);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center flex-col">
      <div className="flex flex-col mt-20 justify-center items-center bg-black rounded-lg p-5">
        <Image src={"/webcam.png"} width={200} height={200} className="absolute" />
        <Webcam
          mirrored={true}
          style={{
            height: 300,
            width: "100%",
            zIndex: 10,
          }}
        />
      </div>
      <Button
        disabled={loading}
        variant="outline"
        className="my-10"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <h2 className="text-red-600 flex gap-2">
            <Mic />
            Stop Recording
          </h2>
        ) : (
          "Record Answer"
        )}
      </Button>
    </div>
  );
}

export default RecordAnswerSection;
