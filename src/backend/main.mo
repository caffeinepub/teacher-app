import Time "mo:core/Time";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Order "mo:core/Order";
import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  type UserRole = AccessControl.UserRole;

  type Subject = {
    #math;
    #science;
    #english;
    #history;
    #other : Text;
  };

  type Profile = {
    name : Text;
    isTeacher : Bool;
    bio : Text;
    subject : ?Subject;
  };

  type ClassStatus = { #scheduled; #live; #ended };

  type Class = {
    id : Text;
    title : Text;
    description : Text;
    subject : Subject;
    scheduledTime : Time.Time;
    teacherId : Principal;
    status : ClassStatus;
    createdAt : Time.Time;
  };

  type Recording = {
    id : Text;
    classId : Text;
    title : Text;
    duration : Nat;
    blob : Storage.ExternalBlob;
    uploadedBy : Principal;
    uploadedAt : Time.Time;
  };

  type ChatMessage = {
    id : Text;
    classId : Text;
    senderId : Principal;
    senderName : Text;
    text : Text;
    sentAt : Time.Time;
  };

  type EntityId = Text;

  let classes = Map.empty<EntityId, Class>();
  let profiles = Map.empty<Principal, Profile>();
  let recordings = Map.empty<EntityId, Recording>();
  let classEnrollments = Map.empty<EntityId, Set.Set<Principal>>();
  let chatMessages = Map.empty<Text, List.List<ChatMessage>>();

  module Class {
    public func compare(class1 : Class, class2 : Class) : Order.Order {
      Text.compare(class1.id, class2.id);
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  func getNextId(prefix : Text) : Text {
    prefix # "_" # Time.now().toText();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?Profile {
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?Profile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other users' profiles");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : Profile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func createClass(title : Text, description : Text, subject : Subject, scheduledTime : Time.Time) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create classes");
    };

    // Verify caller is a teacher
    switch (profiles.get(caller)) {
      case (?profile) {
        if (not profile.isTeacher) {
          Runtime.trap("Unauthorized: Only teachers can create classes");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: Profile required to create classes");
      };
    };

    let classId = getNextId("class");
    let newClass : Class = {
      id = classId;
      title;
      description;
      subject;
      scheduledTime;
      teacherId = caller;
      status = #scheduled;
      createdAt = Time.now();
    };
    classes.add(classId, newClass);
    classId;
  };

  public shared ({ caller }) func enrollInClass(classId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can enroll in classes");
    };

    // Verify caller is a student (not a teacher)
    switch (profiles.get(caller)) {
      case (?profile) {
        if (profile.isTeacher) {
          Runtime.trap("Unauthorized: Teachers cannot enroll in classes");
        };
      };
      case (null) {
        Runtime.trap("Unauthorized: Profile required to enroll in classes");
      };
    };

    if (not (classes.containsKey(classId))) {
      Runtime.trap("Class does not exist");
    };

    let userId = caller;
    let existingEnrollments = switch (classEnrollments.get(classId)) {
      case (?enrollments) { enrollments };
      case (null) { Set.empty<Principal>() };
    };
    existingEnrollments.add(userId);
    classEnrollments.add(classId, existingEnrollments);
  };

  public shared ({ caller }) func uploadRecording(classId : Text, title : Text, duration : Nat, blob : Storage.ExternalBlob) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload recordings");
    };

    // Verify class exists and caller is the teacher
    switch (classes.get(classId)) {
      case (?classData) {
        if (classData.teacherId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the class teacher can upload recordings");
        };
      };
      case (null) {
        Runtime.trap("Class does not exist");
      };
    };

    let recordingId = getNextId("recording");
    let newRecording : Recording = {
      id = recordingId;
      classId;
      title;
      duration;
      blob;
      uploadedBy = caller;
      uploadedAt = Time.now();
    };
    recordings.add(recordingId, newRecording);
    recordingId;
  };

  public query ({ caller }) func getClasses() : async [Class] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view classes");
    };
    classes.toArray().map(func((_, cl)) { cl });
  };

  public query ({ caller }) func getClass(classId : Text) : async Class {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view classes");
    };
    switch (classes.get(classId)) {
      case (?cl) { cl };
      case (null) { Runtime.trap("Class does not exist") };
    };
  };

  public query ({ caller }) func getRecordings() : async [Recording] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view recordings");
    };
    recordings.toArray().map(func((_, rec)) { rec });
  };

  public query ({ caller }) func getRecording(recordingId : Text) : async Recording {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view recordings");
    };
    switch (recordings.get(recordingId)) {
      case (?rec) { rec };
      case (null) { Runtime.trap("Recording does not exist") };
    };
  };

  public query ({ caller }) func getClassEnrollees(classId : Text) : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view class enrollees");
    };

    // Verify caller is the teacher of the class or an admin
    switch (classes.get(classId)) {
      case (?classData) {
        if (classData.teacherId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the class teacher or admins can view enrollees");
        };
      };
      case (null) {
        Runtime.trap("Class does not exist");
      };
    };

    switch (classEnrollments.get(classId)) {
      case (?enrollees) { enrollees.toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func deleteClass(classId : Text) : async () {
    switch (classes.get(classId)) {
      case (?classData) {
        // Allow deletion by the teacher who created it or by admins
        if (classData.teacherId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only the class teacher or admins can delete classes");
        };
      };
      case (null) {
        Runtime.trap("Class does not exist");
      };
    };
    classes.remove(classId);
  };

  // Chat messages feature

  public shared ({ caller }) func sendChatMessage(classId : Text, text : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send chat messages");
    };

    // Verify class exists
    let classData = switch (classes.get(classId)) {
      case (?cl) { cl };
      case (null) {
        Runtime.trap("Class does not exist");
      };
    };

    // Verify caller is either the teacher or enrolled in the class
    let isTeacher = classData.teacherId == caller;
    let isEnrolled = switch (classEnrollments.get(classId)) {
      case (?enrollees) { enrollees.contains(caller) };
      case (null) { false };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    if (not (isTeacher or isEnrolled or isAdmin)) {
      Runtime.trap("Unauthorized: Only the class teacher, enrolled students, or admins can send messages");
    };

    let messageId = getNextId("message");
    let senderName = switch (profiles.get(caller)) {
      case (?profile) { profile.name };
      case (null) { "Anonymous" };
    };

    let newMessage : ChatMessage = {
      id = messageId;
      classId;
      senderId = caller;
      senderName;
      text;
      sentAt = Time.now();
    };

    let existingMessages = switch (chatMessages.get(classId)) {
      case (?msgs) { msgs };
      case (null) { List.empty<ChatMessage>() };
    };

    existingMessages.add(newMessage);
    chatMessages.add(classId, existingMessages);

    messageId;
  };

  public query ({ caller }) func getChatMessages(classId : Text) : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat messages");
    };

    // Verify class exists
    let classData = switch (classes.get(classId)) {
      case (?cl) { cl };
      case (null) {
        Runtime.trap("Class does not exist");
      };
    };

    // Verify caller is either the teacher or enrolled in the class
    let isTeacher = classData.teacherId == caller;
    let isEnrolled = switch (classEnrollments.get(classId)) {
      case (?enrollees) { enrollees.contains(caller) };
      case (null) { false };
    };
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);

    if (not (isTeacher or isEnrolled or isAdmin)) {
      Runtime.trap("Unauthorized: Only the class teacher, enrolled students, or admins can view messages");
    };

    switch (chatMessages.get(classId)) {
      case (?msgs) {
        msgs.reverse().toArray();
      };
      case (null) { [] };
    };
  };
};
