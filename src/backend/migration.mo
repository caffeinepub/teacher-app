import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Storage "blob-storage/Storage";

module {
  type Subject = {
    #math;
    #science;
    #english;
    #history;
    #other : Text;
  };

  type ClassStatus = { #scheduled; #live; #ended };

  type Profile = {
    name : Text;
    isTeacher : Bool;
    bio : Text;
    subject : ?Subject;
  };

  type Class = {
    id : Text;
    title : Text;
    description : Text;
    subject : Subject;
    scheduledTime : Int;
    teacherId : Principal.Principal;
    status : ClassStatus;
    createdAt : Int;
  };

  type Recording = {
    id : Text;
    classId : Text;
    title : Text;
    duration : Nat;
    blob : Storage.ExternalBlob;
    uploadedBy : Principal.Principal;
    uploadedAt : Int;
  };

  type EntityId = Text;

  type OldActor = {
    classes : Map.Map<EntityId, Class>;
    profiles : Map.Map<Principal.Principal, Profile>;
    recordings : Map.Map<EntityId, Recording>;
    classEnrollments : Map.Map<EntityId, Set.Set<Principal.Principal>>;
  };

  type ChatMessage = {
    id : Text;
    classId : Text;
    senderId : Principal.Principal;
    senderName : Text;
    text : Text;
    sentAt : Int;
  };

  type NewActor = {
    classes : Map.Map<EntityId, Class>;
    profiles : Map.Map<Principal.Principal, Profile>;
    recordings : Map.Map<EntityId, Recording>;
    classEnrollments : Map.Map<EntityId, Set.Set<Principal.Principal>>;
    chatMessages : Map.Map<Text, List.List<ChatMessage>>;
  };

  // Migration function called by the main actor via the with-clause
  public func run(old : OldActor) : NewActor {
    {
      old with
      chatMessages = Map.empty<Text, List.List<ChatMessage>>();
    };
  };
};
