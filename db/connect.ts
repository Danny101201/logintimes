import mongoose from 'mongoose';

export const connectDb = async () => {
    const info = await mongoose.connect(process.env.DBURL as string).then(() => {
        console.log('success connect to mongodb')
    });
}