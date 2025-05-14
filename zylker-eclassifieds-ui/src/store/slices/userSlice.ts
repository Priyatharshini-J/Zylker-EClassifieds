import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User }  from '../../types';

interface UserState {
    user: User | null;
    isAuthenticated: boolean;
}

const initialState: UserState = {
    user: {
      userId: '',
      name: '',
      email: ''
    },
    isAuthenticated: false
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
      setUser: (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      }
    },
  });
  
  export const { setUser } = userSlice.actions;
  export default userSlice.reducer;