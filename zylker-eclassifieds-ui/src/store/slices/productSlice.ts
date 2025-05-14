import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product }  from '../../types';


interface ProductState {
    products: Product[];
    loading: boolean;
    error: string | null;
  }
  
  const initialState: ProductState = {
    products: [],
    loading: false,
    error: null,
  };
  
  const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
      fetchProductsStart(state) {
        state.loading = true;
      },
      fetchProductsSuccess(state, action: PayloadAction<Product[]>) {
        state.loading = false;
        state.products = action.payload;
      },
      fetchProductsFailure(state, action: PayloadAction<string>) {
        state.loading = false;
        state.error = action.payload;
      },
    },
  });
  
  export const { fetchProductsStart, fetchProductsSuccess, fetchProductsFailure } = productSlice.actions;
  export default productSlice.reducer;
