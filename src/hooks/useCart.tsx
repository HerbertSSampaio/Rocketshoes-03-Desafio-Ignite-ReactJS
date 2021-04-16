import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart',);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    
    try {
      const stockItem: Stock = await api.get(`/stock/${productId}`)
      .then((response) => response.data);
      const copyProducts = cart.map(product => ({...product}))

      const productExist = copyProducts.find((product) => (product.id === productId));

      if(productExist){
          if(productExist.amount + 1 > stockItem.amount){
            throw toast.error('Quantidade solicitada fora de estoque');
          }

        const newCart = cart.map((product: Product) => product.id === productId ? { 
          ...product,
          amount: product.amount + 1,
        } : {
          ...product
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {

        const product: Product = await api.get(`/products/${productId}`)
        .then((response) => response.data);

          const addProduct: Product = {
            ...product,
            amount: 1,
          }

          if(addProduct.amount > stockItem.amount){
            throw new Error();
          }
          copyProducts.push(addProduct);

          setCart(copyProducts);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(copyProducts));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const copyProducts = cart.map(product => ({...product}))

      if(!copyProducts.find(cart => cart.id === productId)){
        toast.error('Erro na remoção do produto');
        return;
      }

      const removeProduct = copyProducts.filter(cart => cart.id !== productId)
      
      setCart(removeProduct);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(removeProduct));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return;
      }

      const stockItem: Stock = await api.get(`/stock/${productId}`)
      .then((response) => response.data);
      if(!stockItem){
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }
      
      const newCart = await cart.map((product: Product) => product.id === productId ? { 
        ...product,
        amount: amount,
      } : {
        ...product
      });

      const newProductExist = newCart.find((product) => (product.id === productId));
      if(!newProductExist){
        throw new Error;
        return;
      }

      if(newProductExist.amount > stockItem.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
