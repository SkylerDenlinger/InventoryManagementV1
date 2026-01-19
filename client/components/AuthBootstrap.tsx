"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setToken, fetchMe } from "@/store/authSlice";

export default function AuthBootstrapper() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      dispatch(setToken(token));   // puts token into redux
      dispatch(fetchMe());         // loads user + sets status authed/guest
    }
  }, [dispatch]);

  return null;
}
