"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { fetchMe } from "@/store/authSlice";

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  return null;
}
