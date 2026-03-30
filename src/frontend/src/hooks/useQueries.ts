import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExternalBlob, Profile, Subject } from "../backend.d";
import { useActor } from "./useActor";

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profile: Profile) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useClasses() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClasses();
    },
    enabled: !!actor && !isFetching,
    staleTime: 15_000,
  });
}

export function useClass(classId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      if (!actor || !classId) return null;
      return actor.getClass(classId);
    },
    enabled: !!actor && !isFetching && !!classId,
  });
}

export function useCreateClass() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      description,
      subject,
      scheduledTime,
    }: {
      title: string;
      description: string;
      subject: Subject;
      scheduledTime: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createClass(title, description, subject, scheduledTime);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteClass() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteClass(classId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useEnrollInClass() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.enrollInClass(classId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useRecordings() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecordings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUploadRecording() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      title,
      duration,
      blob,
    }: {
      classId: string;
      title: string;
      duration: bigint;
      blob: any;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.uploadRecording(classId, title, duration, blob);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}
