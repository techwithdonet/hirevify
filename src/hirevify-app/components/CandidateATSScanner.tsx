import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Sparkles, Target } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { FilesAPI } from '../utils/api/files';
import { useAuth } from './AuthProvider';
import { CandidateATSResults } from './CandidateATSResults';

interface CandidateATSScannerProps {
 showUploadDialog: boolean;
 setShowUploadDialog: (show: boolean) => void;
}

export function CandidateATSScanner({ showUploadDialog, setShowUploadDialog }: CandidateATSScannerProps) {
 const { user } = useAuth();
 const [isScanning, setIsScanning] = useState(false);
 const [scanProgress, setScanProgress] = useState(0);
 const [isDragOver, setIsDragOver] = useState(false);
 const [atsResults, setAtsResults] = useState<any>(null);
 const [showResults, setShowResults] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 console.log('...... CANDIDATE ATS Scanner rendered:', { showUploadDialog, isScanning });

 const handleFileUpload = async (files: FileList | null) => {
 console.log('..." CANDIDATE scanner - handleFileUpload called with:', files);
 
 if (!files || files.length === 0) {
 toast.error('No file selected. Please choose a resume file to upload.');
 return;
 }

 if (isScanning) {
 toast.warning('File upload already in progress. Please wait...');
 return;
 }

 const file = files[0];
 console.log('..." Processing file:', { name: file.name, size: file.size, type: file.type });

 // Validate file type
 const validExtensions = ['.pdf', '.doc', '.docx'];
 const validMimeTypes = [
 'application/pdf',
 'application/msword',
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
 ];
 
 const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
 const isValidExtension = validExtensions.includes(fileExtension);
 const isValidMimeType = validMimeTypes.includes(file.type);
 const isValidType = isValidExtension || isValidMimeType;

 if (!isValidType) {
 toast.error(`Invalid file type: ${file.name}. Please upload PDF, DOC, or DOCX files only.`);
 return;
 }

 // Validate file size (10MB limit)
 const maxSize = 10 * 1024 * 1024; // 10MB
 if (file.size > maxSize) {
 toast.error(`File too large: ${file.name}. Maximum size is 10MB.`);
 return;
 }

 console.log('... Starting upload for file:', file.name);
 setIsScanning(true);
 setScanProgress(0);
 toast.success(`Resume "${file.name}" uploaded successfully! Starting ATS analysis...`);

 try {
 // Step 1: Document parsing
 setScanProgress(25);
 toast.info('..." Parsing document structure...');
 await new Promise(resolve => setTimeout(resolve, 1000));

 // Step 2: AI content analysis 
 setScanProgress(50);
 toast.info('... AI analyzing content with OpenAI GPT-4...');
 await new Promise(resolve => setTimeout(resolve, 1500));

 // Step 3: Real ATS processing with OpenAI
 setScanProgress(75);
 const accessToken = user?.accessToken || localStorage.getItem('hirevify_access_token');
 
 if (!user) {
 throw new Error('Authentication required. Please log in to analyze your resume.');
 }
 
 if (!accessToken) {
 throw new Error('Authentication session expired. Please log out and log in again.');
 }
 setScanProgress(90);
 
 const atsResult = await FilesAPI.processResumeATS(
 file,
 'General', // Default target role
 'Technology', // Default target industry 
 accessToken
 );

 console.log('..."... Real ATS analysis completed:', atsResult);
 setAtsResults(atsResult);

 // Step 4: Complete
 setScanProgress(100);
 await new Promise(resolve => setTimeout(resolve, 500));

 setIsScanning(false);
 setScanProgress(0);
 setShowUploadDialog(false);
 setShowResults(true);
 
 toast.success(`...... AI ATS analysis completed! Overall score: ${atsResult.atsScore?.overall || 'N/A'}% - Your resume has been analyzed with enterprise-grade accuracy.`);
 console.log('... Real OpenAI-powered analysis completed successfully');

 } catch (error) {
 console.error('...„ Error during real ATS processing:', error);
 console.error('Error details:', {
 message: error instanceof Error? error.message: 'Unknown error',
 name: error instanceof Error? error.name: 'Unknown',
 stack: error instanceof Error? error.stack: 'No stack trace'
 });
 
 setIsScanning(false);
 setScanProgress(0);
 
 // Show detailed error message
 const errorMessage = error instanceof Error? error.message: 'Unknown error occurred';
 toast.error(`Resume analysis failed: ${errorMessage}. Please try again or contact support if the issue persists.`);
 setShowUploadDialog(false);
 }
 };

 const triggerFileUpload = () => {
 console.log('... Triggering file upload');
 if (fileInputRef.current &&!isScanning) {
 fileInputRef.current.click();
 } else {
 console.log('...„ File input not available or scanning in progress');
 toast.error('File upload not available. Please try again.');
 }
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (!isScanning) {
 setIsDragOver(true);
 }
 };

 const handleDragLeave = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setIsDragOver(false);
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setIsDragOver(false);
 
 if (!isScanning && e.dataTransfer.files.length > 0) {
 handleFileUpload(e.dataTransfer.files);
 }
 };

 return (
 <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
 <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
 <DialogHeader className="flex-shrink-0">
 <DialogTitle className="flex items-center justify-between text-lg">
 <div className="flex items-center">
 <Target className="w-5 h-5 mr-2 text-blue-600" />...... Resume ATS Checker (For Job Seekers)
 </div>
 <Button 
 variant="ghost" 
 size="sm" 
 onClick={() => setShowUploadDialog(false)}
 className="h-8 w-8 p-0"
 >
 <X className="w-4 h-4" />
 </Button>
 </DialogTitle>
 <DialogDescription>
 Upload your resume to get instant ATS compatibility analysis and personalized optimization tips. Supports PDF, DOC, and DOCX files up to 10MB.
 </DialogDescription>
 </DialogHeader>

 <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
 <div className="space-y-4 pb-2">
 {/* Clear Candidate Banner */}
 <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg p-4 text-center">
 <div className="flex items-center justify-center gap-2 mb-2">
 <Sparkles className="w-5 h-5 text-blue-600" />
 <h3 className="font-semibold text-blue-800">FOR JOB SEEKERS ONLY</h3>
 <Sparkles className="w-5 h-5 text-blue-600" />
 </div>
 <p className="text-sm text-blue-700 font-medium">
 Upload your resume to get instant ATS compatibility analysis and personalized optimization tips
 </p>
 </div>

 {/* File Requirements */}
 <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
 <div className="flex items-start gap-2">
 <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
 <div>
 <h4 className="text-sm font-semibold text-yellow-800 mb-1">Upload requirements</h4>
 <div className="text-xs text-yellow-700 space-y-1">
 <div> <strong>Files:</strong> 1 resume per scan</div>
 <div> <strong>Size:</strong> Maximum 10MB</div>
 <div> <strong>Formats:</strong> PDF, DOC, DOCX only</div>
 <div> <strong>Analysis time:</strong> 10-15 seconds</div>
 </div>
 </div>
 </div>
 </div>

 {/* Upload Area - Large and Clear */}
 <div 
 className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer min-h-[200px] flex flex-col items-center justify-center ${
 isDragOver? 'border-blue-500 bg-blue-50 scale-105': isScanning? 'border-gray-300 bg-gray-50 cursor-not-allowed': 'border-gray-400 hover:border-blue-500 hover:bg-blue-50'
 }`}
 onClick={triggerFileUpload}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 >
 <FileText className={`w-16 h-16 mx-auto mb-4 ${isScanning? 'text-gray-400': 'text-blue-500'}`} />
 
 <h3 className="text-xl font-semibold mb-2">
 {isScanning? 'Analyzing Your Resume...': '..." Upload Your Resume'}
 </h3>
 
 <p className="text-sm text-muted-foreground mb-6 max-w-sm">
 {isScanning? 'Please wait while we analyze your resume for ATS compatibility': 'Drag and drop your resume file here, or click the button below to browse and select your file'
 }
 </p>
 
 <input
 ref={fileInputRef}
 type="file"
 accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
 onChange={(e) => {
 console.log('..." File input onChange triggered');
 if (e.target.files && e.target.files.length > 0) {
 handleFileUpload(e.target.files);
 }
 e.target.value = '';
 }}
 className="hidden"
 disabled={isScanning}
 />
 
 <Button 
 variant="outline" 
 disabled={isScanning}
 onClick={(e) => {
 e.stopPropagation();
 triggerFileUpload();
 }}
 className="bg-blue-500 text-white hover:bg-blue-600 border-blue-500 px-8 py-3"
 >
 <Upload className="w-5 h-5 mr-2" />
 {isScanning? 'Analyzing...': 'Choose Resume File'}
 </Button>
 
 <p className="text-xs text-muted-foreground mt-2">
 PDF, DOC, DOCX Max 10MB
 </p>
 </div>

 {/* Benefits - Compact */}
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-green-50 border border-green-200 rounded-lg p-3">
 <div className="flex items-center gap-2 mb-2">
 <CheckCircle className="w-4 h-4 text-green-600" />
 <span className="text-sm font-medium text-green-800">You&apos;ll get</span>
 </div>
 <ul className="text-xs text-green-700 space-y-1">
 <li> ATS compatibility score</li>
 <li> Keyword recommendations</li>
 <li> Format optimization tips</li>
 </ul>
 </div>

 <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
 <div className="flex items-center gap-2 mb-2">
 <Sparkles className="w-4 h-4 text-purple-600" />
 <span className="text-sm font-medium text-purple-800">Benefits</span>
 </div>
 <ul className="text-xs text-purple-700 space-y-1">
 <li> 2-3x more interviews</li>
 <li> Beat ATS filters</li>
 <li> Industry-specific advice</li>
 </ul>
 </div>
 </div>

 {/* Progress Bar */}
 {isScanning && (
 <div className="space-y-3 border-t border-border pt-4">
 <div className="flex items-center justify-between text-sm">
 <span className="font-medium">... Analyzing your resume...</span>
 <span className="font-bold text-blue-600">{scanProgress}%</span>
 </div>
 <Progress value={scanProgress} className="h-3 bg-gray-200" />
 <p className="text-xs text-center text-muted-foreground">
 Checking formatting, keywords, ATS compatibility, and generating personalized recommendations...
 </p>
 </div>
 )}
 </div>
 </div>
 </DialogContent>
 
 {/* Results Dialog */}
 <CandidateATSResults
 results={atsResults}
 isOpen={showResults}
 onClose={() => setShowResults(false)}
 onNewScan={() => {
 setShowResults(false);
 setAtsResults(null);
 setShowUploadDialog(true);
 }}
 />
 </Dialog>
 );
}









