import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase/firebase.js'
import { withRetry } from '../utils/retry.js'
import { updateUserProfile } from './userService.js'

async function uploadFile(path, file) {
  return withRetry(async () => {
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, file)
    return getDownloadURL(storageRef)
  })
}

export async function uploadAvatar(uid, file) {
  const extension = file.name.split('.').pop() || 'jpg'
  const url = await uploadFile(`avatars/${uid}.${extension}`, file)
  await updateUserProfile(uid, { photoURL: url })
  return url
}

export async function uploadResource(courseId, lessonId, file) {
  return uploadFile(`resources/${courseId}/${lessonId}/${file.name}`, file)
}

export async function uploadCourseThumbnail(courseId, file) {
  const extension = file.name.split('.').pop() || 'jpg'
  return uploadFile(`course-thumbnails/${courseId}.${extension}`, file)
}

export async function getFileUrl(path) {
  return withRetry(async () => getDownloadURL(ref(storage, path)))
}
