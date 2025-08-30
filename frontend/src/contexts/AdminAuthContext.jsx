import React, { createContext, useContext, useReducer, useEffect } from 'react';
import api from '../utils/axios';

const initialState = {
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

const ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.LOGIN_START:
      return { ...state, isLoading: true, error: null };
    case ACTIONS.LOGIN_SUCCESS:
      return { ...state, admin: action.payload, isAuthenticated: true, isLoading: false, error: null };
    case ACTIONS.LOGIN_FAILURE:
      return { ...state, admin: null, isAuthenticated: false, isLoading: false, error: action.payload };
    case ACTIONS.LOGOUT:
      return { ...state, admin: null, isAuthenticated: false, isLoading: false, error: null };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    default:
      return state;
  }
};

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
};

export const AdminAuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      return;
    }
    // verify token
    api.get('/admin/verify').then((res) => {
      if (res.data.success) {
        dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: res.data.data.admin });
      } else {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      }
    }).catch(() => {
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    });
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: ACTIONS.LOGIN_START });
      const res = await api.post('/admin/login', { identifier: email, password });
      if (res.data.success) {
        const { tokens, admin } = res.data.data;
        localStorage.setItem('adminAccessToken', tokens.accessToken);
        localStorage.setItem('adminRefreshToken', tokens.refreshToken);
        dispatch({ type: ACTIONS.LOGIN_SUCCESS, payload: admin });
        return { success: true };
      }
      throw new Error(res.data.message || 'Login failed');
    } catch (e) {
      const errorMessage = e.response?.data?.message || e.message || 'Login failed';
      dispatch({ type: ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    dispatch({ type: ACTIONS.LOGOUT });
  };

  const clearError = () => dispatch({ type: ACTIONS.CLEAR_ERROR });

  return (
    <AdminAuthContext.Provider value={{
      admin: state.admin,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login,
      logout,
      clearError
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
