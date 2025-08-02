import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    query,
    orderBy,
    where,
    getDoc
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  export interface Task {
    id?: string;
    title: string;
    description: string;
    expReward: number;
    createdAt: Date;
    createdBy: string;
  }
  
  export interface TaskSubmission {
    id?: string;
    taskId: string;
    userId: string;
    proofURL: string;
    status: 'pending' | 'accepted' | 'rejected';
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
  }
  
  export const createTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...task,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  };
  
  export const getTasks = async (): Promise<Task[]> => {
    try {
      const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task));
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  };
  
  export const submitTaskProof = async (submission: Omit<TaskSubmission, 'id' | 'submittedAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'tasks', submission.taskId, 'submissions'), {
        ...submission,
        submittedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  };
  
  export const getTaskSubmissions = async (taskId?: string): Promise<TaskSubmission[]> => {
    try {
      let submissions: TaskSubmission[] = [];
      
      if (taskId) {
        // Get submissions for specific task
        const q = query(
          collection(db, 'tasks', taskId, 'submissions'), 
          orderBy('submittedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        submissions = querySnapshot.docs.map(doc => ({
          id: doc.id,
          taskId,
          ...doc.data()
        } as TaskSubmission));
      } else {
        // Get all submissions from all tasks
        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        
        for (const taskDoc of tasksSnapshot.docs) {
          const submissionsSnapshot = await getDocs(
            query(
              collection(db, 'tasks', taskDoc.id, 'submissions'),
              orderBy('submittedAt', 'desc')
            )
          );
          
          const taskSubmissions = submissionsSnapshot.docs.map(doc => ({
            id: doc.id,
            taskId: taskDoc.id,
            ...doc.data()
          } as TaskSubmission));
          
          submissions.push(...taskSubmissions);
        }
        
        // Sort all submissions by submitted date
        submissions.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
      }
      
      return submissions;
    } catch (error) {
      console.error('Error getting submissions:', error);
      return [];
    }
  };
  
  export const reviewSubmission = async (
    taskId: string, 
    submissionId: string, 
    status: 'accepted' | 'rejected',
    reviewerId: string
  ) => {
    try {
      const submissionRef = doc(db, 'tasks', taskId, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        status,
        reviewedAt: new Date(),
        reviewedBy: reviewerId
      });
      
      // If accepted, add EXP to user
      if (status === 'accepted') {
        const submissionDoc = await getDoc(submissionRef);
        const submission = submissionDoc.data() as TaskSubmission;
        
        const taskDoc = await getDoc(doc(db, 'tasks', taskId));
        const task = taskDoc.data() as Task;
        
        if (submission && task) {
          // Update user EXP
          const userRef = doc(db, 'users', submission.userId);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();
          
          if (userData) {
            const newExp = userData.exp + task.expReward;
            const newLevel = Math.floor(newExp / 100) + 1; // Simple leveling: 100 EXP per level
            
            await updateDoc(userRef, {
              exp: newExp,
              level: newLevel
            });
          }
        }
      }
    } catch (error) {
      throw error;
    }
  };