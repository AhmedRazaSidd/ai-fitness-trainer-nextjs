"use client"

import { Card } from '@/components/ui/card';
import { vapi } from '@/lib/vapi';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const GenerateProgramPage = () => {

    const [callActive, setCallActive] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [messages, setMessages] = useState([]);
    const [callEnded, setCallEnded] = useState(false);

    const { user } = useUser();
    const router = useRouter();

    // AUTO SCROLL MESSAGES
    const messageContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // NAVIGATE USER TO PROFILE PAGE AFTER THE CALL ENDS
    useEffect(() => {
        if (callEnded) {
            const redirectTimer = setTimeout(() => {
                router.push('/profile');
            }, 1500)

            return () => clearTimeout(redirectTimer);
        }
    }, [callEnded, router]);


    // SETUP EVENT LISTNER FOR VAPI
    useEffect(() => {

        const handleCallStart = () => {
            console.log('Call started');
            setConnecting(false);
            setCallActive(true);
            setCallEnded(false);
        }
        const handleCallEnd = () => {
            console.log('Call ended')
            setCallActive(false);
            setConnecting(false);
            setIsSpeaking(false);
            setCallEnded(true);
        }
        const handleSpeechStart = () => {
            console.log('AI startedSpeaking');
            setIsSpeaking(true);
        }
        const handleSpeechEnd = () => {
            console.log('AI stoppedSpeaking');
            setIsSpeaking(false);
        }
        const handleMessage = (message: any) => { }
        const handleError = (error: any) => {
            console.log('Vapi Error', error);
            setConnecting(false);
            setCallActive(false);
        }

        vapi.on('call-start', handleCallStart)
            .on('call-end', handleCallEnd)
            .on('speech-start', handleSpeechStart)
            .on('speech-end', handleSpeechEnd)
            .on('message', handleMessage)
            .on('error', handleError)

        // CLEAN UP EVENT LISTNER ON UNMOUNT
        return () => {
            vapi.off('call-start', handleCallStart)
                .off('call-end', handleCallEnd)
                .off('speech-start', handleSpeechStart)
                .off('speech-end', handleSpeechEnd)
                .off('message', handleMessage)
                .off('error', handleError)
        }
    }, [])

    // TOGGLE CALL
    const toggleCall = async () => {
        if (callActive) vapi.stop();
        else {
            try {
                setConnecting(true);
                setMessages([]);
                setCallEnded(false);

                const fullName = user?.fullName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'There';
                await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
                    variableValues: {
                        full_name: fullName,
                        // TODO: send user_id as well later
                    }
                })

            } catch (error) {
                console.log('Failed to start call', error);
                setConnecting(false);
            }
        }
    }

    return (
        <div className='flex flex-col min-h-screen text-foreground overflow-hidden pb-6 pt-24'>
            <div className='container mx-auto px-4 h-full max-w-5xl'>
                {/* TITLE */}
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold font-mono'>
                        <span>Generate Your</span>
                        <span className='text-primary uppercase'>Fitness Program</span>
                    </h1>
                    <p className='text-muted-foreground mt-2'>
                        Have a voice conversation with our AI assistant to create your personalized plan
                    </p>
                </div>
                {/* VIDEO CALL AREA */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                    {/* AI ASSISTANTS CARD */}
                    <Card className='bg-card/90 backdrop-blur-sm border border-border overflow-hidden relative'>
                        <div className='aspect-video flex flex-col items-center justify-center p-6 relative'>
                            {/* AI VOICE ANIMATION */}
                            <div
                                className={`absolute inset-0 ${isSpeaking ? "opacity-30" : "opacity-0"
                                    } transition-opacity duration-300`}
                            >
                                {/* Voice wave animation when speaking */}
                                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-center items-center h-20">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`mx-1 h-16 w-1 bg-primary rounded-full ${isSpeaking ? "animate-sound-wave" : ""
                                                }`}
                                            style={{
                                                animationDelay: `${i * 0.1}s`,
                                                height: isSpeaking ? `${Math.random() * 50 + 20}%` : "5%",
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            {/* AI IMAGE */}
                            <div className='relative size-32 mb-4'>
                                <div className={`absolute inset-0  bg-primary opacity-10 rounded-full blur-lg ${isSpeaking ? 'animate-pulse' : ''}`} />
                                <div className='relative w-full h-full rounded-full bg-card flex items-center justify-between border-border overflow-hidden'>
                                    <div className='absolute inset-0 bg-gradient-to-b from-primary/10 to-secondary/10'></div>
                                    <img src="/ai-avatar.png" alt="AI Assistant" className='w-full h-full object-cover' />
                                </div>
                            </div>
                            <h2 className='text-xl font-bold text-foreground'>FitVoice AI</h2>
                            <p className='text-sm text-muted-foreground mt-1'>Fitness & Diet Coach</p>
                        </div>
                    </Card>
                    <Card></Card>
                </div>
            </div>
        </div>
    )
}

export default GenerateProgramPage