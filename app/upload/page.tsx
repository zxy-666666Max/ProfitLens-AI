import UploadDropzone from "@/components/upload-dropzone";

export default function UploadPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload receipts</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Add your sales or purchase receipts and we will use them to update your business report.
        </p>
      </div>

      <UploadDropzone />

      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-50">Tips for better results</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Take photos in good light with the whole receipt in view.</li>
          <li>Upload one receipt per file when possible.</li>
          <li>Blurry or cropped receipts may be read incorrectly.</li>
        </ul>
      </div>
    </div>
  );
}