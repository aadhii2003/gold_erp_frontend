import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
    token: string | null;
    user: any | null;
    rates: { gold_price: number; forex_rate: number } | null;
}

const initialState: AuthState = {
    token: localStorage.getItem('token'),
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null,
    rates: localStorage.getItem('rates') ? JSON.parse(localStorage.getItem('rates') as string) : { gold_price: 2000, forex_rate: 3800 },
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<{ user: any; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        setRates: (state, action: PayloadAction<{ gold_price: number; forex_rate: number }>) => {
            state.rates = action.payload;
            localStorage.setItem('rates', JSON.stringify(action.payload));
        }
    },
});

export const { setCredentials, logout, setRates } = authSlice.actions;

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
