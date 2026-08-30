export type Visibility = 'public' | 'private';
export interface BaseRecord { id:string; createdAt:string; updatedAt:string; visibility:Visibility; sortOrder:number }
export interface Profile extends BaseRecord { name:string; title:string; introduction:string; about:string; email:string; phone?:string; address?:string }
export interface Education extends BaseRecord { institution:string; qualification:string; startYear:string; endYear:string }
export interface Experience extends BaseRecord { company:string; position:string; employmentType:string; startDate:string; endDate:string; location:string; responsibilities:string[]; technologies:string[] }
export interface Project extends BaseRecord { name:string; projectType:string; courseName:string; year:string; shortDescription:string; fullDescription:string; objective:string; role:string; solution:string; techStack:string[]; features:string[]; skillsLearned:string[]; githubUrl:string; demoUrl:string; coverImageId:string; documentationId:string; featured:boolean }
export interface Certification extends BaseRecord { name:string; shortName:string; issuer:string; issuedDate:string; expirationDate:string; credentialId:string; credentialUrl:string; documentId:string; description:string; skills:string[]; publicDocument:boolean; featured:boolean }
export interface Skill extends BaseRecord { name:string; category:string }
export interface SocialLink extends BaseRecord { platform:string; url:string }
export interface DocumentRecord extends BaseRecord { name:string; kind:string; driveFileId:string; mimeType:string; publicDocument:boolean }
export interface PortfolioData { profile:Profile|null; education:Education[]; experience:Experience[]; projects:Project[]; certifications:Certification[]; skills:Skill[]; socialLinks:SocialLink[]; documents:DocumentRecord[]; languages:{name:string;level:string}[]; lastUpdated:string }
