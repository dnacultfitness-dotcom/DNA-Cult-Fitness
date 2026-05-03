import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType, getDocs, query, where } from '../firebase';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO,
  link?: string
) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      read: false,
      link,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, 'notifications');
  }
};

export const notifyAdmins = async (
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO,
  link?: string
) => {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminDocs = await getDocs(q);
    
    // Also include the hardcoded admin email just in case
    const adminIds = new Set(adminDocs.docs.map(doc => doc.id));
    
    // Fetch user with specifically that email to get their ID if not in query
    const qEmail = query(collection(db, 'users'), where('email', '==', 'dnacultfitness@gmail.com'));
    const hardcodedAdmin = await getDocs(qEmail);
    hardcodedAdmin.forEach(d => adminIds.add(d.id));

    const promises = Array.from(adminIds).map(adminId => 
      createNotification(adminId, title, message, type, link)
    );
    
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to notify admins:', err);
  }
};
