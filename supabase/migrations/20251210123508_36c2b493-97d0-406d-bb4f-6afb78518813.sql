-- Add RLS policies for courses table to allow authenticated users to manage
CREATE POLICY "Authenticated users can insert courses" 
ON public.courses 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update courses" 
ON public.courses 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete courses" 
ON public.courses 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add RLS policies for lessons table to allow authenticated users to manage
CREATE POLICY "Authenticated users can insert lessons" 
ON public.lessons 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update lessons" 
ON public.lessons 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete lessons" 
ON public.lessons 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add RLS policies for course_materials table to allow authenticated users to manage
CREATE POLICY "Authenticated users can insert course materials" 
ON public.course_materials 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update course materials" 
ON public.course_materials 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete course materials" 
ON public.course_materials 
FOR DELETE 
USING (auth.uid() IS NOT NULL);