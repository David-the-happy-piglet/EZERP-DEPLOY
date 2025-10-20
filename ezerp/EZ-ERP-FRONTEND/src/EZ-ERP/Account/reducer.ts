import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    currentUser: null,
};
const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        setCurrentUser: (state, action) => {
            state.currentUser = action.payload;
        },
    },
});
export const { setCurrentUser } = accountSlice.actions;
export default accountSlice.reducer;

export const isAdmin = (currentUser: any) => currentUser?.role === "ADMIN";
