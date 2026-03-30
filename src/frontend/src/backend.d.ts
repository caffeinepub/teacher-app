import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Class {
    id: string;
    status: ClassStatus;
    title: string;
    subject: Subject;
    scheduledTime: Time;
    createdAt: Time;
    description: string;
    teacherId: Principal;
}
export type Time = bigint;
export interface ChatMessage {
    id: string;
    text: string;
    classId: string;
    sentAt: Time;
    senderName: string;
    senderId: Principal;
}
export interface Profile {
    bio: string;
    subject?: Subject;
    name: string;
    isTeacher: boolean;
}
export type Subject = {
    __kind__: "other";
    other: string;
} | {
    __kind__: "math";
    math: null;
} | {
    __kind__: "history";
    history: null;
} | {
    __kind__: "english";
    english: null;
} | {
    __kind__: "science";
    science: null;
};
export interface Recording {
    id: string;
    title: string;
    duration: bigint;
    blob: ExternalBlob;
    classId: string;
    uploadedAt: Time;
    uploadedBy: Principal;
}
export enum ClassStatus {
    scheduled = "scheduled",
    live = "live",
    ended = "ended"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createClass(title: string, description: string, subject: Subject, scheduledTime: Time): Promise<string>;
    deleteClass(classId: string): Promise<void>;
    enrollInClass(classId: string): Promise<void>;
    getCallerUserProfile(): Promise<Profile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessages(classId: string): Promise<Array<ChatMessage>>;
    getClass(classId: string): Promise<Class>;
    getClassEnrollees(classId: string): Promise<Array<Principal>>;
    getClasses(): Promise<Array<Class>>;
    getRecording(recordingId: string): Promise<Recording>;
    getRecordings(): Promise<Array<Recording>>;
    getUserProfile(user: Principal): Promise<Profile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: Profile): Promise<void>;
    sendChatMessage(classId: string, text: string): Promise<string>;
    uploadRecording(classId: string, title: string, duration: bigint, blob: ExternalBlob): Promise<string>;
}
