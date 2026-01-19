import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

type User = {
  id: string;
  email: string;
  roles: string[];
  districtId: number | null;
  locationId: number | null;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  status: "idle" | "loading" | "authed" | "guest" | "error";
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  status: "idle",
  error: null,
};

// Thunk: calls /me using the token in state (or localStorage fallback)
export const fetchMe = createAsyncThunk<User, void, { rejectValue: string }>(
  "auth/fetchMe",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { auth: AuthState };

    const token =
      state.auth.accessToken ?? localStorage.getItem("accessToken");

    if (!token) return rejectWithValue("No token available");

    try {
      const res = await fetch("http://localhost:5230/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return rejectWithValue(`ME failed: ${res.status} ${text}`);
      }

      return (await res.json()) as User;
    } catch (e) {
      return rejectWithValue("Network/CORS error while calling /me");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string | null>) {
      state.accessToken = action.payload;
      if (action.payload) {
        localStorage.setItem("accessToken", action.payload);
      } else {
        localStorage.removeItem("accessToken");
      }
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "guest";
      state.error = null;
      localStorage.removeItem("accessToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "authed";
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.user = null;
        state.status = "guest";
        state.error = action.payload ?? "Unknown error";
      });
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;
