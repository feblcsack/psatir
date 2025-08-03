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
  userName?: string;    // tambahkan ini
  userEmail?: string;
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

// Tambahkan interfaces ini di tasks.ts

export interface UserActivity {
  id: string;
  type: 'task_submission' | 'check_in' | 'task_accepted' | 'task_rejected';
  userId: string;
  timestamp: Date;
  data: {
    // For task activities
    taskId?: string;
    taskTitle?: string;
    expReward?: number;
    submissionStatus?: 'pending' | 'accepted' | 'rejected';
    // For check-in activities
    checkInStreak?: number;
    checkInReward?: number;
  };
  description: string;
}

// Tambahkan fungsi-fungsi ini di tasks.ts

export const getUserActivities = async (userId: string): Promise<UserActivity[]> => {
  try {
    const activities: UserActivity[] = [];
    
    // Get all task submissions by user
    const allSubmissions = await getTaskSubmissions();
    const userSubmissions = allSubmissions.filter(sub => sub.userId === userId);
    
    // Get all tasks to get task titles
    const allTasks = await getTasks();
    const tasksMap = new Map(allTasks.map(task => [task.id!, task]));
    
    // Process task submissions
    for (const submission of userSubmissions) {
      const task = tasksMap.get(submission.taskId);
      
      // Add submission activity
      activities.push({
        id: `submission_${submission.id}`,
        type: 'task_submission',
        userId: submission.userId,
        timestamp: submission.submittedAt,
        data: {
          taskId: submission.taskId,
          taskTitle: task?.title || 'Unknown Task',
          expReward: task?.expReward || 0,
          submissionStatus: submission.status
        },
        description: `Submitted proof for "${task?.title || 'Unknown Task'}"`
      });
      
      // Add review activity if reviewed
      if (submission.reviewedAt && submission.status !== 'pending') {
        activities.push({
          id: `review_${submission.id}`,
          type: submission.status === 'accepted' ? 'task_accepted' : 'task_rejected',
          userId: submission.userId,
          timestamp: submission.reviewedAt,
          data: {
            taskId: submission.taskId,
            taskTitle: task?.title || 'Unknown Task',
            expReward: submission.status === 'accepted' ? (task?.expReward || 0) : 0,
            submissionStatus: submission.status
          },
          description: submission.status === 'accepted' 
            ? `Task "${task?.title || 'Unknown Task'}" was accepted (+${task?.expReward || 0} EXP)`
            : `Task "${task?.title || 'Unknown Task'}" was rejected`
        });
      }
    }
    
    // Get check-in activities (you'll need to implement this based on your check-in system)
    const checkInActivities = await getUserCheckInActivities(userId);
    activities.push(...checkInActivities);
    
    // Sort by timestamp (newest first)
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return activities;
  } catch (error) {
    console.error('Error getting user activities:', error);
    return [];
  }
};

export const getUserCheckInActivities = async (userId: string): Promise<UserActivity[]> => {
  try {
    // This assumes you have a check-ins collection
    // Adjust according to your actual check-in implementation
    const checkInsQuery = query(
      collection(db, 'check-ins'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    
    const checkInsSnapshot = await getDocs(checkInsQuery);
    
    return checkInsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: `checkin_${doc.id}`,
        type: 'check_in' as const,
        userId: data.userId,
        timestamp: (data.timestamp as any).toDate(),
        data: {
          checkInStreak: data.streak || 1,
          checkInReward: data.expReward || 10
        },
        description: `Daily check-in completed (${data.streak || 1} day streak, +${data.expReward || 10} EXP)`
      };
    });
  } catch (error) {
    console.error('Error getting check-in activities:', error);
    // If check-ins collection doesn't exist yet, return empty array
    return [];
  }
};

export const getActivityStats = async (userId: string) => {
  try {
    const activities = await getUserActivities(userId);
    
    const stats = {
      totalActivities: activities.length,
      tasksSubmitted: activities.filter(a => a.type === 'task_submission').length,
      tasksCompleted: activities.filter(a => a.type === 'task_accepted').length,
      tasksRejected: activities.filter(a => a.type === 'task_rejected').length,
      checkIns: activities.filter(a => a.type === 'check_in').length,
      totalExpEarned: activities
        .filter(a => a.type === 'task_accepted' || a.type === 'check_in')
        .reduce((sum, a) => sum + (a.data.expReward || a.data.checkInReward || 0), 0),
      thisWeekActivities: activities.filter(a => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return a.timestamp >= weekAgo;
      }).length,
      thisMonthActivities: activities.filter(a => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return a.timestamp >= monthAgo;
      }).length
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return {
      totalActivities: 0,
      tasksSubmitted: 0,
      tasksCompleted: 0,
      tasksRejected: 0,
      checkIns: 0,
      totalExpEarned: 0,
      thisWeekActivities: 0,
      thisMonthActivities: 0
    };
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
      
      // Process submissions with user data
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        // Fetch user data
        let userName = 'Unknown User';
        let userEmail = null;
        
        try {
          // Perbaikan: gunakan doc() function yang benar
          const userDocRef = doc(db, 'users', data.userId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as any; // Type assertion untuk menghindari error
            userName = userData?.name || userData?.displayName || userData?.email?.split('@')[0] || 'Unknown User';
            userEmail = userData?.email || null;
          }
        } catch (userError) {
          console.warn(`Could not fetch user data for userId: ${data.userId}`, userError);
        }
        
        submissions.push({
          id: docSnapshot.id,
          taskId,
          ...data,
          userName,
          userEmail,
          submittedAt: (data.submittedAt as any).toDate(),
          reviewedAt: (data.reviewedAt as any)?.toDate?.() ?? undefined,
        } as TaskSubmission);
      }
    } else {
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      
      for (const taskDoc of tasksSnapshot.docs) {
        const submissionsSnapshot = await getDocs(
          query(
            collection(db, 'tasks', taskDoc.id, 'submissions'),
            orderBy('submittedAt', 'desc')
          )
        );
        
        // Process each submission with user data
        for (const submissionDoc of submissionsSnapshot.docs) {
          const data = submissionDoc.data();
          
          // Fetch user data
          let userName = 'Unknown User';
          let userEmail = null;
          
          try {
            // Perbaikan: gunakan doc() function yang benar
            const userDocRef = doc(db, 'users', data.userId);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data() as any; // Type assertion untuk menghindari error
              userName = userData?.name || userData?.displayName || userData?.email?.split('@')[0] || 'Unknown User';
              userEmail = userData?.email || null;
            }
          } catch (userError) {
            console.warn(`Could not fetch user data for userId: ${data.userId}`, userError);
          }
          
          submissions.push({
            id: submissionDoc.id,
            taskId: taskDoc.id,
            ...data,
            userName,
            userEmail,
            submittedAt: (data.submittedAt as any).toDate(),
            reviewedAt: (data.reviewedAt as any)?.toDate?.() ?? undefined,
          } as TaskSubmission);
        }
      }
      
      // Sort all submissions by date
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