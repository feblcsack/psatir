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

// Tambahkan fungsi ini di tasks.ts

export const getUserTaskSubmission = async (taskId: string, userId: string): Promise<TaskSubmission | null> => {
  try {
    const q = query(
      collection(db, 'tasks', taskId, 'submissions'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      taskId,
      ...data,
      submittedAt: (data.submittedAt as any).toDate(),
      reviewedAt: (data.reviewedAt as any)?.toDate?.() ?? undefined,
    } as TaskSubmission;
  } catch (error) {
    console.error('Error getting user submission:', error);
    return null;
  }
};

export const getTasks = async (): Promise<Task[]> => {
  try {
    const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Konversi Firestore Timestamp ke JavaScript Date
            createdAt: (data.createdAt as any).toDate(),
        } as Task;
    });
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

// =======================================================
// ## FUNGSI BARU UNTUK MENGHAPUS TUGAS ##
// =======================================================
/**
 * Menghapus sebuah task dari Firestore berdasarkan ID-nya.
 * @param taskId - ID dari task yang akan dihapus.
 */
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const taskDocRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskDocRef);
  } catch (error) {
    console.error("Error deleting task: ", error);
    // Lemparkan error kembali agar bisa ditangani di frontend
    throw new Error('Failed to delete task.');
  }
};
// =======================================================

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
      const q = query(
        collection(db, 'tasks', taskId, 'submissions'),
        orderBy('submittedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      submissions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          taskId,
          ...data,
          submittedAt: (data.submittedAt as any).toDate(),
          reviewedAt: (data.reviewedAt as any)?.toDate?.() ?? undefined,
        } as TaskSubmission;
      });
    } else {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));

      for (const taskDoc of tasksSnapshot.docs) {
        const submissionsSnapshot = await getDocs(
          query(
            collection(db, 'tasks', taskDoc.id, 'submissions'),
            orderBy('submittedAt', 'desc')
          )
        );

        const taskSubmissions = submissionsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            taskId: taskDoc.id,
            ...data,
            submittedAt: (data.submittedAt as any).toDate(),
            reviewedAt: (data.reviewedAt as any)?.toDate?.() ?? undefined,
          } as TaskSubmission;
        });

        submissions.push(...taskSubmissions);
      }

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
      if (!submissionDoc.exists()) return;
      const submission = submissionDoc.data() as TaskSubmission;
      
      const taskDoc = await getDoc(doc(db, 'tasks', taskId));
      if (!taskDoc.exists()) return;
      const task = taskDoc.data() as Task;
      
      // Update user EXP
      const userRef = doc(db, 'users', submission.userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const newExp = (userData.exp || 0) + task.expReward;
        const newLevel = Math.floor(newExp / 100) + 1; // Simple leveling: 100 EXP per level
        
        await updateDoc(userRef, {
          exp: newExp,
          level: newLevel
        });
      }
    }
  } catch (error) {
    throw error;
  }
};