import React, { createContext, useReducer } from 'react';
import { storyAPI, chapterAPI } from '../services/api';

const StoryContext = createContext();

// Initial state
const initialState = {
  stories: [],
  currentStory: null,
  currentChapter: null,
  chaptersCache: {}, // Cache chapters by ID for instant switching
  loading: false,
  error: null,
};

// Action types
const STORY_ACTIONS = {
  SET_STORIES: 'SET_STORIES',
  SET_CURRENT_STORY: 'SET_CURRENT_STORY',
  SET_CURRENT_CHAPTER: 'SET_CURRENT_CHAPTER',
  CACHE_CHAPTERS: 'CACHE_CHAPTERS',
  ADD_STORY: 'ADD_STORY',
  UPDATE_STORY: 'UPDATE_STORY',
  DELETE_STORY: 'DELETE_STORY',
  ADD_CHAPTER: 'ADD_CHAPTER',
  UPDATE_CHAPTER: 'UPDATE_CHAPTER',
  DELETE_CHAPTER: 'DELETE_CHAPTER',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Reducer
const storyReducer = (state, action) => {
  switch (action.type) {
    case STORY_ACTIONS.SET_STORIES:
      return { ...state, stories: action.payload, loading: false };
    case STORY_ACTIONS.SET_CURRENT_STORY:
      return { ...state, currentStory: action.payload, loading: false };
    case STORY_ACTIONS.SET_CURRENT_CHAPTER:
      return { ...state, currentChapter: action.payload, loading: false };
    case STORY_ACTIONS.CACHE_CHAPTERS:
      return { 
        ...state, 
        chaptersCache: { 
          ...state.chaptersCache, 
          ...action.payload 
        } 
      };
    case STORY_ACTIONS.ADD_STORY:
      return { ...state, stories: [action.payload, ...state.stories], loading: false };
    case STORY_ACTIONS.UPDATE_STORY:
      return {
        ...state,
        stories: state.stories.map((s) => (s._id === action.payload._id ? action.payload : s)),
        currentStory: state.currentStory?._id === action.payload._id ? action.payload : state.currentStory,
        loading: false,
      };
    case STORY_ACTIONS.DELETE_STORY:
      return {
        ...state,
        stories: state.stories.filter((s) => s._id !== action.payload),
        currentStory: state.currentStory?._id === action.payload ? null : state.currentStory,
        loading: false,
      };
    case STORY_ACTIONS.ADD_CHAPTER:
      if (state.currentStory) {
        return {
          ...state,
          currentStory: {
            ...state.currentStory,
            chapters: [...state.currentStory.chapters, action.payload],
          },
          loading: false,
        };
      }
      return state;
    case STORY_ACTIONS.UPDATE_CHAPTER:
      return {
        ...state,
        currentChapter: state.currentChapter?._id === action.payload._id ? action.payload : state.currentChapter,
        chaptersCache: {
          ...state.chaptersCache,
          [action.payload._id]: action.payload,
        },
        loading: false,
      };
    case STORY_ACTIONS.DELETE_CHAPTER:
      if (state.currentStory) {
        return {
          ...state,
          currentStory: {
            ...state.currentStory,
            chapters: state.currentStory.chapters.filter((c) => c._id !== action.payload),
          },
          currentChapter: state.currentChapter?._id === action.payload ? null : state.currentChapter,
          loading: false,
        };
      }
      return state;
    case STORY_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case STORY_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// Provider component
export const StoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(storyReducer, initialState);

  // Fetch all stories
  const fetchStories = async () => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      const response = await storyAPI.getStories();
      dispatch({ type: STORY_ACTIONS.SET_STORIES, payload: response.data.data.stories });
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Fetch single story
  const fetchStory = async (id) => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      const response = await storyAPI.getStory(id);
      const story = response.data.data.story;
      
      // Cache all chapters for instant switching
      if (story.chapters && story.chapters.length > 0) {
        const chaptersMap = {};
        story.chapters.forEach(chapter => {
          chaptersMap[chapter._id] = chapter;
        });
        dispatch({ type: STORY_ACTIONS.CACHE_CHAPTERS, payload: chaptersMap });
      }
      
      dispatch({ type: STORY_ACTIONS.SET_CURRENT_STORY, payload: story });
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Create story
  const createStory = async (data) => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      const response = await storyAPI.createStory(data);
      dispatch({ type: STORY_ACTIONS.ADD_STORY, payload: response.data.data.story });
      return { success: true, story: response.data.data.story };
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Update story
  const updateStory = async (id, data) => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      const response = await storyAPI.updateStory(id, data);
      dispatch({ type: STORY_ACTIONS.UPDATE_STORY, payload: response.data.data.story });
      return { success: true };
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Delete story
  const deleteStory = async (id) => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      await storyAPI.deleteStory(id);
      dispatch({ type: STORY_ACTIONS.DELETE_STORY, payload: id });
      return { success: true };
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Fetch chapter (with caching)
  const fetchChapter = async (id) => {
    try {
      // Check cache first for instant switching
      if (state.chaptersCache[id]) {
        dispatch({ type: STORY_ACTIONS.SET_CURRENT_CHAPTER, payload: state.chaptersCache[id] });
        return;
      }
      
      // If not in cache, fetch from API
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      const response = await chapterAPI.getChapter(id);
      const chapter = response.data.data.chapter;
      
      // Cache the chapter
      dispatch({ type: STORY_ACTIONS.CACHE_CHAPTERS, payload: { [id]: chapter } });
      dispatch({ type: STORY_ACTIONS.SET_CURRENT_CHAPTER, payload: chapter });
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
    }
  };

  // Create chapter
  const createChapter = async (storyId, data) => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      const response = await chapterAPI.createChapter(storyId, data);
      dispatch({ type: STORY_ACTIONS.ADD_CHAPTER, payload: response.data.data.chapter });
      return { success: true, chapter: response.data.data.chapter };
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Update chapter
  const updateChapter = async (id, data) => {
    try {
      const response = await chapterAPI.updateChapter(id, data);
      dispatch({ type: STORY_ACTIONS.UPDATE_CHAPTER, payload: response.data.data.chapter });
      return { success: true };
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Delete chapter
  const deleteChapter = async (id) => {
    try {
      dispatch({ type: STORY_ACTIONS.SET_LOADING, payload: true });
      await chapterAPI.deleteChapter(id);
      dispatch({ type: STORY_ACTIONS.DELETE_CHAPTER, payload: id });
      return { success: true };
    } catch (error) {
      dispatch({ type: STORY_ACTIONS.SET_ERROR, payload: error.message });
      return { success: false, error: error.message };
    }
  };

  const value = {
    stories: state.stories,
    currentStory: state.currentStory,
    currentChapter: state.currentChapter,
    chaptersCache: state.chaptersCache,
    loading: state.loading,
    error: state.error,
    fetchStories,
    fetchStory,
    createStory,
    updateStory,
    deleteStory,
    fetchChapter,
    createChapter,
    updateChapter,
    deleteChapter,
  };

  return <StoryContext.Provider value={value}>{children}</StoryContext.Provider>;
};

export default StoryContext;

