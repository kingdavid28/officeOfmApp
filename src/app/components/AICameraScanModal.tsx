import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
    Camera,
    X,
    Zap,
    CheckCircle,
    AlertCircle,
    RotateCcw,
    Scan,
    Brain,
    Eye,
    Target
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import { AIReceiptScanner, CameraManager, ScannedReceiptData } from '../../lib/ai-receipt-scanner';

interface AICameraScanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanComplete: (scannedData: ScannedReceiptData, imageFile: File) => void;
}

export const AICameraScanModal: React.FC<AICameraScanModalProps> = ({
    isOpen,
    onClose,
    onScanComplete
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [scanResult, setScanResult] = useState<ScannedReceiptData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const cameraManager = useRef<CameraManager>(new CameraManager());
    const aiScanner = useRef<AIReceiptScanner>(new AIReceiptScanner());

    useEffect(() => {
        if (isOpen) {
            initializeAI();
        } else {
            cleanup();
        }

        return () => cleanup();
    }, [isOpen]);

    const initializeAI = async () => {
        try {
            setError(null);
            await aiScanner.current.initialize();
        } catch (error) {
            console.error('Failed to initialize AI scanner:', error);
            setError('Failed to initialize AI scanner. Please try again.');
        }
    };

    const startCamera = async () => {
        try {
            setError(null);
            const video = await cameraManager.current.startCamera({
                width: 1280,
                height: 720,
                facingMode: 'environment',
                quality: 0.8
            });

            if (videoRef.current) {
                videoRef.current.srcObject = video.srcObject;
                setIsCameraActive(true);
            }
        } catch (error) {
            console.error('Failed to start camera:', error);
            setError('Camera access denied or not available. Please check permissions.');
        }
    };

    const captureAndScan = async () => {
        if (!isCameraActive) {
            await startCamera();
            return;
        }

        try {
            setIsScanning(true);
            setError(null);

            // Capture image from camera
            const imageFile = await cameraManager.current.captureImage(0.8);
            setCapturedImage(imageFile);

            // Create preview URL
            const url = URL.createObjectURL(imageFile);
            setPreviewUrl(url);

            // Stop camera to free resources
            cameraManager.current.stopCamera();
            setIsCameraActive(false);

            // Scan the image with AI
            const scannedData = await aiScanner.current.scanImage(imageFile);
            setScanResult(scannedData);

        } catch (error) {
            console.error('Failed to capture and scan:', error);
            setError('Failed to scan receipt. Please try again.');
        } finally {
            setIsScanning(false);
        }
    };

    const retakePhoto = () => {
        setScanResult(null);
        setCapturedImage(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl('');
        }
        startCamera();
    };

    const confirmScan = () => {
        if (scanResult && capturedImage) {
            onScanComplete(scanResult, capturedImage);
            handleClose();
        }
    };

    const handleClose = () => {
        cleanup();
        onClose();
    };

    const cleanup = () => {
        cameraManager.current.stopCamera();
        setIsCameraActive(false);
        setIsScanning(false);
        setScanResult(null);
        setCapturedImage(null);
        setError(null);

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl('');
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600';
        if (confidence >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 0.8) return 'default';
        if (confidence >= 0.6) return 'secondary';
        return 'destructive';
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        AI Receipt Scanner
                        <Badge variant="outline" className="ml-2">
                            <Zap className="w-3 h-3 mr-1" />
                            Powered by AI
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {!scanResult ? (
                        // Camera/Capture Phase
                        <div className="space-y-4">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                {isCameraActive ? (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-white">
                                        <div className="text-center">
                                            <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                            <p className="text-lg font-medium mb-2">AI Receipt Scanner Ready</p>
                                            <p className="text-sm text-gray-300 mb-4">
                                                Position your receipt in good lighting for best results
                                            </p>
                                            <Button onClick={startCamera} className="bg-blue-600 hover:bg-blue-700">
                                                <Camera className="w-4 h-4 mr-2" />
                                                Start Camera
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Camera overlay guides */}
                                {isCameraActive && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                                        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                            <Target className="w-3 h-3 inline mr-1" />
                                            Align receipt within frame
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-center gap-3">
                                {isCameraActive ? (
                                    <>
                                        <Button
                                            onClick={captureAndScan}
                                            disabled={isScanning}
                                            size="lg"
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {isScanning ? (
                                                <>
                                                    <Scan className="w-4 h-4 mr-2 animate-pulse" />
                                                    Scanning...
                                                </>
                                            ) : (
                                                <>
                                                    <Scan className="w-4 h-4 mr-2" />
                                                    Capture & Scan
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                cameraManager.current.stopCamera();
                                                setIsCameraActive(false);
                                            }}
                                            variant="outline"
                                            size="lg"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Stop Camera
                                        </Button>
                                    </>
                                ) : (
                                    <Button onClick={handleClose} variant="outline" size="lg">
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                )}
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h3 className="font-medium text-blue-800 mb-1">AI Scanning Tips</h3>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            <li>• Ensure good lighting and avoid shadows</li>
                                            <li>• Keep the receipt flat and fully visible</li>
                                            <li>• Hold the camera steady for best OCR results</li>
                                            <li>• The AI will automatically extract amount, date, and vendor</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Scan Results Phase
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Image Preview */}
                                <div>
                                    <h3 className="font-medium mb-2">Captured Receipt</h3>
                                    <div className="relative">
                                        <img
                                            src={previewUrl}
                                            alt="Captured receipt"
                                            className="w-full rounded-lg border"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <Badge variant={getConfidenceBadge(scanResult.confidence)}>
                                                {Math.round(scanResult.confidence)}% confidence
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* Extracted Data */}
                                <div>
                                    <h3 className="font-medium mb-2 flex items-center gap-2">
                                        <Brain className="w-4 h-4 text-blue-600" />
                                        AI Extracted Data
                                    </h3>
                                    <div className="space-y-3">
                                        {scanResult.extractedData.amount && (
                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-green-800">Amount</span>
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                </div>
                                                <p className="text-lg font-bold text-green-900">
                                                    ₱{scanResult.extractedData.amount.toLocaleString()}
                                                </p>
                                            </div>
                                        )}

                                        {scanResult.extractedData.date && (
                                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-blue-800">Date</span>
                                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <p className="font-medium text-blue-900">
                                                    {new Date(scanResult.extractedData.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        )}

                                        {scanResult.extractedData.vendor && (
                                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-purple-800">Vendor</span>
                                                    <CheckCircle className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <p className="font-medium text-purple-900">
                                                    {scanResult.extractedData.vendor}
                                                </p>
                                            </div>
                                        )}

                                        {scanResult.suggestedCategory && (
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-yellow-800">Suggested Category</span>
                                                    <Badge variant="outline" className={getConfidenceColor(scanResult.categoryConfidence || 0)}>
                                                        {Math.round((scanResult.categoryConfidence || 0) * 100)}%
                                                    </Badge>
                                                </div>
                                                <p className="font-medium text-yellow-900">
                                                    {scanResult.suggestedCategory}
                                                </p>
                                            </div>
                                        )}

                                        {scanResult.extractedData.invoiceNumber && (
                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                <span className="text-sm font-medium text-gray-800">Invoice #</span>
                                                <p className="font-medium text-gray-900">
                                                    {scanResult.extractedData.invoiceNumber}
                                                </p>
                                            </div>
                                        )}

                                        {scanResult.extractedData.taxAmount && (
                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                <span className="text-sm font-medium text-gray-800">Tax Amount</span>
                                                <p className="font-medium text-gray-900">
                                                    ₱{scanResult.extractedData.taxAmount.toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Raw OCR Text */}
                            <div>
                                <h3 className="font-medium mb-2">Raw OCR Text</h3>
                                <div className="p-3 bg-gray-50 border rounded-lg max-h-32 overflow-y-auto">
                                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                        {scanResult.text}
                                    </pre>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-end">
                                <Button onClick={retakePhoto} variant="outline">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retake Photo
                                </Button>
                                <Button onClick={confirmScan} className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Use This Data
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};