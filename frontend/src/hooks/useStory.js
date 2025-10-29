import { useContext } from 'react';
import StoryContext from '../context/StoryContext';

/**
 * Custom hook to use story context
 */
const useStory = () => {
  const context = useContext(StoryContext);
  
  if (!context) {
    throw new Error('useStory must be used within StoryProvider');
  }
  
  return context;
};

export default useStory;

