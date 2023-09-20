import { ChangeEvent, useMemo, FormEvent, useState, useRef } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

import { FileVideo, Upload } from "lucide-react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";

export function VideoInputForm() {
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const promptInputRef = useRef<HTMLTextAreaElement>(null);

   /* received movie */
   function handleFileSelectd(event: ChangeEvent<HTMLInputElement>) {
      const { files } = event.currentTarget

      if (!files) {
         return
      }

      const selectFile = files[0]

      setVideoFile(selectFile)

   }

   /* ajust preview the movie em label */
   const previewURL = useMemo(() => {
      if (!videoFile) {
         return null
      }

      return URL.createObjectURL(videoFile)
   }, [videoFile])

   /* convert video and audio in the browser */
   async function convertVideoToAudio(video: File) {
      console.log('Convert started.')

      const ffmpeg = await getFFmpeg();

      await ffmpeg.writeFile('input.mp4', await fetchFile(video));

      ffmpeg.on('progress', progress => {
         console.log('Convert progress: ' + Math.round(progress.progress * 100));
      })

      await ffmpeg.exec([
         '-i',
         'input.mp4',
         '-map',
         '0:a',
         '-b:a',
         '20k',
         '-acodec',
         'libmp3lame',
         'output.mp3'
      ])

      const data = await ffmpeg.readFile('output.mp3')

      const audioFileBlob = new Blob([data], { type: 'audio/mpeg'});
      const audioFile = new File([audioFileBlob], 'audio.mp3', {
         type: 'audio/mpeg',
      });

      console.log('Convert finished');

      return audioFile

      /* displaying possible error with: 
      ffmpeg.on('log', log => {
         console.log(log)
      }) */
   }

   /* receiving video and text for sending  */
   async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
      event.preventDefault()

      const prompt = promptInputRef.current?.value;

      if (!videoFile) {
         return
      }

      /* call function convertVideoToAudio */
      const audioFile = await convertVideoToAudio(videoFile)
      console.log(audioFile);
   }

   return (
      <form onSubmit={handleUploadVideo} className="space-y-6">
         <label 
            htmlFor="video" 
            className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/5"
         >
            {previewURL ? (
               <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
            ) : (
               <>
                  <FileVideo />
                  Selecione um vídeo
               </>
            )}
         </label>

         <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelectd}/>

         <Separator />

         <div className="space-y-1">
            <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
            <Textarea 
               ref={promptInputRef}
               id="transcription_prompt"
               className="h-20 leading-relaxed resize-none"
               placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
            />
         </div>

         <Button type="submit" className="w-full">
            Carregar vídeo
            <Upload className="w-4 h-4 ml-2"/>
         </Button>
         </form>
   )
}